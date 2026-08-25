import type Phaser from 'phaser';
import type { BulletSpawn, PatternContext } from '../core/types';
import { PATTERNS } from '../systems/patterns';
import type { SeededRandom } from '../core/rng';
import type { SfxName } from '../systems/audio/music';

export interface BossApi {
  spawnBullets(spawns: BulletSpawn[], tint: number): void;
  playerPos(): { x: number; y: number };
  rng: SeededRandom;
  bulletSpeedMult: number;
  fireIntervalMult: number;
  shake(intensity: number, durationMs: number): void;
  sfx(name: SfxName): void;
  summonEnemy(defId: string, xFrac: number): void;
}

export interface BossHazard {
  x: number;
  halfWidth: number;
  yTop: number;
  yBottom: number;
}

const BODY_TINT_HIT = 0xffffff;

function pattern(
  id: string,
  x: number,
  y: number,
  aimRad: number,
  timeMs: number,
  rng: SeededRandom,
  params: Record<string, number>,
): BulletSpawn[] {
  const gen = PATTERNS[id];
  const ctx: PatternContext = { x, y, aimAngleRad: aimRad, timeMs, rng };
  return gen(ctx, params);
}

export abstract class BossBase {
  readonly container: Phaser.GameObjects.Container;

  hp: number;

  readonly maxHp: number;

  protected t = 0;

  protected entered = false;

  protected dying = false;

  constructor(
    protected readonly scene: Phaser.Scene,
    protected readonly api: BossApi,
    hp: number,
  ) {
    this.hp = hp;
    this.maxHp = hp;
    this.container = scene.add.container(270, -160).setDepth(50);
  }

  get x(): number {
    return this.container.x;
  }

  get y(): number {
    return this.container.y;
  }

  get hpFraction(): number {
    return Math.max(0, this.hp / this.maxHp);
  }

  get isEntered(): boolean {
    return this.entered;
  }

  get isDying(): boolean {
    return this.dying;
  }

  get defeated(): boolean {
    return this.dying && this.hp <= 0;
  }

  abstract update(dtMs: number): void;

  abstract hitCircles(): Array<{ x: number; y: number; r: number; part: string }>;

  abstract hazards(): BossHazard[];

  takeDamageAt(amount: number, hx: number, hy: number): number {
    if (!this.entered || this.dying) return 0;
    let bestDistSq = Infinity;
    let bestPart: string | null = null;
    for (const c of this.hitCircles()) {
      const dx = hx - c.x;
      const dy = hy - c.y;
      const d = dx * dx + dy * dy;
      const rr = c.r * c.r;
      if (d <= rr && d < bestDistSq) {
        bestDistSq = d;
        bestPart = c.part;
      }
    }
    if (bestPart === null) return 0;
    return this.routeDamage(bestPart, amount);
  }

  protected abstract routeDamage(part: string, amount: number): number;

  protected beginDeath(): void {
    this.dying = true;
    this.api.sfx('explodeBig');
    this.api.shake(0.012, 900);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 1400,
      ease: 'Quad.In',
      onComplete: () => this.container.setVisible(false),
    });
    let flashes = 10;
    const flashEvent = this.scene.time.addEvent({
      delay: 130,
      repeat: 9,
      callback: () => {
        flashes--;
        this.container.setAlpha(flashes % 2 === 0 ? 1 : 0.35);
      },
    });
    this.scene.events.once('shutdown', () => flashEvent.remove());
  }

  destroy(): void {
    this.container.destroy();
  }
}

interface SolbreakerState {
  turretTimerMs: number;
  coreAimTimerMs: number;
  spiralTimerMs: number;
  wallTimerMs: number;
  summonTimerMs: number;
  turretSide: number;
  phase: number;
}

export class SolbreakerBoss extends BossBase {
  private readonly sprite: Phaser.GameObjects.Image;

  private st: SolbreakerState = {
    turretTimerMs: 2200,
    coreAimTimerMs: 2800,
    spiralTimerMs: 2400,
    wallTimerMs: 3200,
    summonTimerMs: 5200,
    turretSide: -1,
    phase: 1,
  };

  constructor(scene: Phaser.Scene, api: BossApi, hpMult: number) {
    super(scene, api, Math.round(2300 * hpMult));
    this.sprite = scene.add.image(0, 0, 'boss_solbreaker');
    this.container.add(this.sprite);
  }

  update(dtMs: number): void {
    this.t += dtMs / 1000;
    const entryY =
      this.t < 2.8 ? -160 + ((140 + 160) * this.t) / 2.8 : 140 + Math.sin(this.t * 0.9) * 12;
    if (this.t >= 2.8 && !this.entered) {
      this.entered = true;
    }
    const frac = this.hpFraction;
    const newPhase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
    if (newPhase !== this.st.phase) {
      this.st.phase = newPhase;
      this.api.sfx('bossWarn');
      this.api.shake(0.006, 300);
    }
    if (this.dying) return;

    const speedFactor = this.st.phase === 3 ? 1.7 : this.st.phase === 2 ? 1.25 : 1;
    this.container.x = 270 + Math.sin(this.t * 0.45 * speedFactor) * 145;
    this.container.y = entryY;
    if (!this.entered) return;

    const im = this.api.fireIntervalMult;
    const bs = this.api.bulletSpeedMult;

    this.st.turretTimerMs -= dtMs;
    if (this.st.turretTimerMs <= 0) {
      this.st.turretTimerMs += (this.st.phase === 1 ? 1700 : 1350) * im;
      this.st.turretSide *= -1;
      const tx = this.container.x + this.st.turretSide * 110;
      const ty = this.container.y + 74;
      const aim = Math.atan2(this.api.playerPos().y - ty, this.api.playerPos().x - tx);
      this.api.spawnBullets(
        pattern('fanBurst', tx, ty, aim, this.t * 1000, this.api.rng, {
          count: this.st.phase === 3 ? 7 : 5,
          spreadDeg: 58,
          speed: 165 * bs,
          wobbleDeg: 4,
          radius: 6,
        }),
        0xff5a6e,
      );
    }

    this.st.coreAimTimerMs -= dtMs;
    if (this.st.coreAimTimerMs <= 0) {
      this.st.coreAimTimerMs += 2600 * im;
      const aim = Math.atan2(
        this.api.playerPos().y - this.container.y,
        this.api.playerPos().x - this.container.x,
      );
      this.api.spawnBullets(
        pattern(
          'aimed',
          this.container.x,
          this.container.y + 76,
          aim,
          this.t * 1000,
          this.api.rng,
          {
            count: 3,
            spreadDeg: 16,
            speed: 235 * bs,
            kind: 1,
          },
        ),
        0xffb02e,
      );
    }

    if (this.st.phase >= 2) {
      this.st.spiralTimerMs -= dtMs;
      if (this.st.spiralTimerMs <= 0) {
        this.st.spiralTimerMs += (this.st.phase === 3 ? 1900 : 2600) * im;
        this.chargeFlash();
        this.api.spawnBullets(
          pattern('ring', this.container.x, this.container.y + 76, 0, this.t * 1000, this.api.rng, {
            count: this.st.phase === 3 ? 20 : 15,
            speed: 132 * bs,
            spinDeg: 26,
            radius: 6,
          }),
          0xc98cff,
        );
      }
      this.st.summonTimerMs -= dtMs;
      if (this.st.summonTimerMs <= 0) {
        this.st.summonTimerMs += 6400 * im;
        this.api.summonEnemy('scoutFinch', 0.25);
        this.api.summonEnemy('scoutFinch', 0.75);
      }
    }

    if (this.st.phase === 3) {
      this.st.wallTimerMs -= dtMs;
      if (this.st.wallTimerMs <= 0) {
        this.st.wallTimerMs += 3400 * im;
        this.chargeFlash();
        this.api.spawnBullets(
          pattern(
            'wallWithGap',
            this.api.rng.range(90, 450),
            -20,
            Math.PI / 2,
            this.t * 1000,
            this.api.rng,
            {
              gapXFrac: this.api.rng.range(0.18, 0.82),
              gapWidthPx: 108,
              spacingPx: 48,
              speed: 150 * bs,
              radius: 6,
              fieldWidth: 540,
            },
          ),
          0xffb02e,
        );
      }
    }
  }

  private chargeFlash(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 90,
      yoyo: true,
      ease: 'Sine.InOut',
    });
  }

  hitCircles(): Array<{ x: number; y: number; r: number; part: string }> {
    return [
      { x: this.container.x, y: this.container.y, r: 62, part: 'body' },
      { x: this.container.x - 110, y: this.container.y + 74, r: 26, part: 'body' },
      { x: this.container.x + 110, y: this.container.y + 74, r: 26, part: 'body' },
    ];
  }

  hazards(): BossHazard[] {
    return [];
  }

  protected routeDamage(_part: string, amount: number): number {
    const applied = Math.min(this.hp, amount);
    this.hp -= applied;
    if (this.hp <= 0) {
      this.beginDeath();
    } else {
      this.flashHit();
    }
    return applied;
  }

  private flashHit(): void {
    this.sprite.setTintFill(BODY_TINT_HIT);
    this.scene.time.delayedCall(40, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
  }
}

type EmberStage = 'thrusters' | 'gunner' | 'core';

interface EmberState {
  stage: EmberStage;
  thrusterHp: [number, number];
  gunnerHp: number;
  dashTimerMs: number;
  activeThruster: number;
  dashTelegraphing: boolean;
  needleTimerMs: number;
  laserTimerMs: number;
  laserPhase: 'idle' | 'warn' | 'fire';
  laserPhaseTimerMs: number;
  laserX: number;
  comboTimerMs: number;
}

const THRUSTER_OFFSET_X = 125;
const THRUSTER_Y = 68;

export class EmberCrownBoss extends BossBase {
  private readonly sprite: Phaser.GameObjects.Image;

  private readonly thrusterGlowL: Phaser.GameObjects.Image;

  private readonly thrusterGlowR: Phaser.GameObjects.Image;

  private readonly warnRect: Phaser.GameObjects.Rectangle;

  private readonly beamImg: Phaser.GameObjects.Image;

  private readonly st: EmberState;

  private readonly poolTotal: number;

  constructor(scene: Phaser.Scene, api: BossApi, hpMult: number) {
    const thrusterHpEach = Math.round(520 * hpMult);
    const coreHp = Math.round(1150 * hpMult);
    super(scene, api, coreHp);
    this.poolTotal = thrusterHpEach * 2 + Math.round(850 * hpMult) + coreHp;
    this.sprite = scene.add.image(0, 0, 'boss_embercrown');
    this.thrusterGlowL = scene.add
      .image(-THRUSTER_OFFSET_X, THRUSTER_Y, 'p_spark')
      .setScale(4)
      .setAlpha(0)
      .setTint(0xffb02e);
    this.thrusterGlowR = scene.add
      .image(THRUSTER_OFFSET_X, THRUSTER_Y, 'p_spark')
      .setScale(4)
      .setAlpha(0)
      .setTint(0xffb02e);
    this.container.add([this.sprite, this.thrusterGlowL, this.thrusterGlowR]);
    this.warnRect = scene.add
      .rectangle(270, 480, 64, 1040, 0xffb02e, 0.22)
      .setDepth(45)
      .setVisible(false);
    this.beamImg = scene.add
      .image(270, 480, 'laser_beam')
      .setDisplaySize(52, 1040)
      .setDepth(46)
      .setVisible(false);
    scene.events.once('shutdown', () => {
      this.warnRect.destroy();
      this.beamImg.destroy();
    });
    this.st = {
      stage: 'thrusters',
      thrusterHp: [thrusterHpEach, thrusterHpEach],
      gunnerHp: Math.round(850 * hpMult),
      dashTimerMs: 2000,
      activeThruster: 0,
      dashTelegraphing: false,
      needleTimerMs: 1500,
      laserTimerMs: 1800,
      laserPhase: 'idle',
      laserPhaseTimerMs: 0,
      laserX: 270,
      comboTimerMs: 2600,
    };
  }

  update(dtMs: number): void {
    this.t += dtMs / 1000;
    const entryY =
      this.t < 3 ? -180 + ((150 + 180) * this.t) / 3 : 150 + Math.sin(this.t * 0.7) * 16;
    if (this.t >= 3 && !this.entered) this.entered = true;
    this.container.y = entryY;
    this.container.x = this.clampX(this.container.x);
    if (this.dying || !this.entered) return;

    const im = this.api.fireIntervalMult;
    const bs = this.api.bulletSpeedMult;

    this.st.needleTimerMs -= dtMs;
    if (this.st.needleTimerMs <= 0) {
      this.st.needleTimerMs += 1750 * im;
      const aim = Math.atan2(
        this.api.playerPos().y - this.container.y,
        this.api.playerPos().x - this.container.x,
      );
      this.api.spawnBullets(
        pattern(
          'aimed',
          this.container.x,
          this.container.y + 96,
          aim,
          this.t * 1000,
          this.api.rng,
          {
            count: 5,
            spreadDeg: 34,
            speed: 205 * bs,
            kind: 1,
          },
        ),
        0xff5a6e,
      );
    }

    switch (this.st.stage) {
      case 'thrusters':
        this.updateThrusterPhase(dtMs, im, bs);
        break;
      case 'gunner':
        this.updateGunnerPhase(dtMs, im);
        break;
      case 'core':
        this.updateCorePhase(dtMs, im, bs);
        break;
    }
  }

  private updateThrusterPhase(dtMs: number, im: number, bs: number): void {
    this.st.dashTimerMs -= dtMs;
    if (!this.st.dashTelegraphing && this.st.dashTimerMs <= 0) {
      this.st.dashTelegraphing = true;
      this.st.activeThruster =
        this.st.thrusterHp[0] > 0 && (this.st.thrusterHp[1] <= 0 || this.api.rng.next() < 0.5)
          ? 0
          : 1;
      const glow = this.st.activeThruster === 0 ? this.thrusterGlowL : this.thrusterGlowR;
      this.api.sfx('bossWarn');
      this.scene.tweens.add({
        targets: glow,
        alpha: 0.85,
        duration: 160,
        yoyo: true,
        repeat: 4,
        onComplete: () => {
          glow.setAlpha(0);
          if (!this.dying && this.entered) this.executeDash(bs);
        },
      });
      this.st.dashTimerMs = 3600 * im;
    }
  }

  private executeDash(bs: number): void {
    this.st.dashTelegraphing = false;
    const targetX = this.api.playerPos().x;
    const dir = targetX > this.container.x ? 1 : -1;
    this.scene.tweens.add({
      targets: this.container,
      x: this.clampX(targetX),
      duration: 520,
      ease: 'Cubic.InOut',
    });
    const tx = this.container.x + dir * THRUSTER_OFFSET_X;
    const ty = this.container.y + THRUSTER_Y;
    this.api.spawnBullets(
      pattern('fanBurst', tx, ty + 20, Math.PI / 2, this.t * 1000, this.api.rng, {
        count: 7,
        spreadDeg: 80,
        speed: 175 * bs,
        radius: 7,
      }),
      0xffb02e,
    );
  }

  private updateGunnerPhase(dtMs: number, im: number): void {
    this.st.laserTimerMs -= dtMs;
    if (this.st.laserPhase === 'idle') {
      if (this.st.laserTimerMs <= 0) {
        this.st.laserPhase = 'warn';
        this.st.laserPhaseTimerMs = 780;
        this.st.laserX = this.api.playerPos().x;
        this.warnRect.setPosition(this.st.laserX, 480).setVisible(true).setAlpha(0.15);
        this.scene.tweens.add({ targets: this.warnRect, alpha: 0.4, duration: 700 });
        this.api.sfx('bossWarn');
      }
    } else if (this.st.laserPhase === 'warn') {
      this.st.laserPhaseTimerMs -= dtMs;
      if (this.st.laserPhaseTimerMs <= 0) {
        this.st.laserPhase = 'fire';
        this.st.laserPhaseTimerMs = 560;
        this.beamImg.setPosition(this.st.laserX, 480).setVisible(true).setAlpha(0.95);
        this.beamImg.setScale(0.6, 1);
        this.scene.tweens.add({ targets: this.beamImg, scaleX: 1, duration: 90 });
        this.api.sfx('explodeBig');
        this.api.shake(0.008, 420);
      }
    } else {
      this.st.laserPhaseTimerMs -= dtMs;
      if (this.st.laserPhaseTimerMs <= 0) {
        this.st.laserPhase = 'idle';
        this.beamImg.setVisible(false);
        this.warnRect.setVisible(false);
        this.st.laserTimerMs = 3800 * im;
      }
    }
  }

  private updateCorePhase(dtMs: number, im: number, bs: number): void {
    this.updateGunnerBeamOnly(dtMs, im);
    this.st.comboTimerMs -= dtMs;
    if (this.st.comboTimerMs <= 0) {
      this.st.comboTimerMs += 2900 * im;
      this.api.spawnBullets(
        pattern('ring', this.container.x, this.container.y + 62, 0, this.t * 1000, this.api.rng, {
          count: 17,
          speed: 138 * bs,
          spinDeg: -20,
          radius: 6,
        }),
        0xc98cff,
      );
      this.api.spawnBullets(
        pattern(
          'splitOrb',
          this.container.x,
          this.container.y + 96,
          Math.PI / 2,
          this.t * 1000,
          this.api.rng,
          {
            speed: 92 * bs,
            splitSpeed: 185 * bs,
            splitCount: 8,
            delayMs: 820,
          },
        ),
        0xff5a6e,
      );
    }
    this.st.dashTimerMs -= dtMs;
    if (this.st.dashTimerMs <= 0) {
      this.st.dashTimerMs = 4200 * im;
      this.api.spawnBullets(
        pattern(
          'wallWithGap',
          this.api.rng.range(80, 460),
          -20,
          Math.PI / 2,
          this.t * 1000,
          this.api.rng,
          {
            gapXFrac: this.api.rng.range(0.2, 0.8),
            gapWidthPx: 112,
            spacingPx: 50,
            speed: 152 * bs,
            radius: 6,
            fieldWidth: 540,
          },
        ),
        0xffb02e,
      );
    }
  }

  private updateGunnerBeamOnly(dtMs: number, im: number): void {
    this.st.laserTimerMs -= dtMs;
    if (this.st.laserPhase === 'idle') {
      if (this.st.laserTimerMs <= 0) {
        this.st.laserPhase = 'warn';
        this.st.laserPhaseTimerMs = 780;
        this.st.laserX = this.api.playerPos().x;
        this.warnRect.setPosition(this.st.laserX, 480).setVisible(true).setAlpha(0.15);
        this.scene.tweens.add({ targets: this.warnRect, alpha: 0.4, duration: 700 });
        this.api.sfx('bossWarn');
      }
    } else if (this.st.laserPhase === 'warn') {
      this.st.laserPhaseTimerMs -= dtMs;
      if (this.st.laserPhaseTimerMs <= 0) {
        this.st.laserPhase = 'fire';
        this.st.laserPhaseTimerMs = 560;
        this.beamImg.setPosition(this.st.laserX, 480).setVisible(true).setAlpha(0.95);
        this.api.sfx('explodeBig');
        this.api.shake(0.008, 420);
      }
    } else {
      this.st.laserPhaseTimerMs -= dtMs;
      if (this.st.laserPhaseTimerMs <= 0) {
        this.st.laserPhase = 'idle';
        this.beamImg.setVisible(false);
        this.warnRect.setVisible(false);
        this.st.laserTimerMs = 4600 * im;
      }
    }
  }

  private clampX(x: number): number {
    return Math.min(430, Math.max(110, x));
  }

  hitCircles(): Array<{ x: number; y: number; r: number; part: string }> {
    const circles: Array<{ x: number; y: number; r: number; part: string }> = [
      { x: this.container.x, y: this.container.y + 62, r: 66, part: 'body' },
    ];
    if (this.st.stage === 'thrusters') {
      if (this.st.thrusterHp[0] > 0) {
        circles.push({
          x: this.container.x - THRUSTER_OFFSET_X,
          y: this.container.y + THRUSTER_Y,
          r: 32,
          part: 'L',
        });
      }
      if (this.st.thrusterHp[1] > 0) {
        circles.push({
          x: this.container.x + THRUSTER_OFFSET_X,
          y: this.container.y + THRUSTER_Y,
          r: 32,
          part: 'R',
        });
      }
    }
    return circles;
  }

  hazards(): BossHazard[] {
    if (this.st.laserPhase !== 'fire') return [];
    return [
      {
        x: this.st.laserX,
        halfWidth: 26,
        yTop: 0,
        yBottom: 1000,
      },
    ];
  }

  protected routeDamage(part: string, amount: number): number {
    if (this.st.stage === 'thrusters') {
      if (part === 'L' || part === 'R') {
        const idx = part === 'L' ? 0 : 1;
        if (this.st.thrusterHp[idx] <= 0) return 0;
        const applied = Math.min(this.st.thrusterHp[idx], amount);
        this.st.thrusterHp[idx] -= applied;
        if (this.st.thrusterHp[idx] <= 0) this.onThrusterDestroyed(idx);
        this.flashHit();
        return applied;
      }
      return 0;
    }
    if (this.st.stage === 'gunner') {
      if (part !== 'body') return 0;
      const applied = Math.min(this.st.gunnerHp, amount);
      this.st.gunnerHp -= applied;
      if (this.st.gunnerHp <= 0) this.enterCoreStage();
      this.flashHit();
      return applied;
    }
    const applied = Math.min(this.hp, amount);
    this.hp -= applied;
    if (this.hp <= 0) this.beginDeath();
    else this.flashHit();
    return applied;
  }

  displayHpFraction(): number {
    if (this.dying) return 0;
    return this.remainingStructure() / this.poolTotal;
  }

  private remainingStructure(): number {
    const thrusters = Math.max(0, this.st.thrusterHp[0]) + Math.max(0, this.st.thrusterHp[1]);
    return thrusters + this.st.gunnerHp + this.hp;
  }

  private onThrusterDestroyed(idx: number): void {
    const glow = idx === 0 ? this.thrusterGlowL : this.thrusterGlowR;
    glow.setAlpha(0);
    this.api.sfx('explodeBig');
    this.api.shake(0.01, 500);
    if (this.st.thrusterHp[0] <= 0 && this.st.thrusterHp[1] <= 0) {
      this.st.stage = 'gunner';
      this.st.laserTimerMs = 1200;
      this.api.sfx('bossWarn');
    }
  }

  private enterCoreStage(): void {
    this.st.stage = 'core';
    this.beamImg.setVisible(false);
    this.warnRect.setVisible(false);
    this.st.laserPhase = 'idle';
    this.st.comboTimerMs = 1200;
    this.st.dashTimerMs = 2600;
    this.api.sfx('bossWarn');
    this.api.shake(0.01, 600);
  }

  beginDeath(): void {
    super.beginDeath();
    this.st.laserPhase = 'idle';
    this.warnRect.setVisible(false);
    this.beamImg.setVisible(false);
  }

  private flashHit(): void {
    this.sprite.setTintFill(BODY_TINT_HIT);
    this.scene.time.delayedCall(40, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
  }
}
