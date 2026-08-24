import Phaser from 'phaser';
import {
  COMBO_WINDOW_MS,
  DEPTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRADE_GRAZE_POINTS,
  GRAZE_RADIUS_PX,
  PLAYER_RESPAWN_MS,
  SCENE,
} from '../core/constants';
import { SeededRandom } from '../core/rng';
import type { StageDef, WaveEvent } from '../core/types';
import { DIFFICULTIES } from '../data/difficulty';
import { getShip } from '../data/ships';
import { STAGES } from '../data/stages';
import { EnemyBulletPool, PlayerBulletPool } from '../entities/bullets';
import type { BossBase } from '../entities/bosses';
import { EmberCrownBoss, SolbreakerBoss, type BossApi } from '../entities/bosses';
import { ItemManager } from '../entities/items';
import { Enemy, type EnemyFireContext } from '../entities/enemy';
import { PlayerShip } from '../entities/player';
import { ParallaxBackground } from '../art/backgrounds';
import { keyToGameCommand, keyToPause, relativeDragToVector } from '../systems/input/commands';
import {
  mapPad,
  snapshotPad,
  type PadInputState,
  type PhaserLikePad,
} from '../systems/input/gamepad';
import {
  createScoreState,
  registerGraze,
  registerItemPickup,
  registerKill,
  tickScore,
} from '../systems/score';
import type { AudioEngine } from '../systems/audio/engine';
import type { SfxName } from '../systems/audio/music';
import type { I18n } from '../systems/locale/i18n';
import type { LocaleKey } from '../systems/locale/en';
import type { SaveService } from '../systems/save';
import { WaveRunner } from '../systems/waves';
import { Hud } from '../ui/hud';
import { FONT_STACK } from '../ui/widgets';
import type { RunState } from './types';

declare const __PD_DEBUG_HOOKS__: boolean;

const FIXED_STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;
const SCORE_CONFIG = {
  comboWindowMs: COMBO_WINDOW_MS,
  multStepCombo: 10,
  multStepValue: 0.5,
  maxMultiplier: 8,
};

interface GameSceneData {
  run: RunState;
}

export class GameScene extends Phaser.Scene {
  private run!: RunState;

  private stage!: StageDef;

  private diff = DIFFICULTIES.normal;

  private scoreState = createScoreState();

  private rng!: SeededRandom;

  private player!: PlayerShip;

  private enemyBullets!: EnemyBulletPool;

  private playerBullets!: PlayerBulletPool;

  private itemsMan!: ItemManager;

  private enemies: Enemy[] = [];

  private boss: BossBase | null = null;

  private background!: ParallaxBackground;

  private hud!: Hud;

  private waveRunner!: WaveRunner;

  private accumulatorMs = 0;

  private stageElapsedMs = 0;

  private bombButton?: Phaser.GameObjects.Image;

  private focusButtonImg?: Phaser.GameObjects.Image;

  private pointerCancelHandler: (() => void) | null = null;

  private bannerText: Phaser.GameObjects.Text | undefined = undefined;

  private touchMode = false;

  private dragId = -1;

  private dragOrigin = { x: 0, y: 0 };

  private dragVector = { x: 0, y: 0 };

  private focused = false;

  private pressedCommands = new Set<string>();

  private padState: PadInputState | null = null;

  private padBombPrev = false;

  private padPausePrev = false;

  private bombCooldownMs = 0;

  private respawnCountdownMs = 0;

  private bossWaveSeen = false;

  private finalBossSpawned = false;

  private bossDeathPendingMs = 0;

  private stageCompleted = false;

  private gameOverStarted = false;

  private godMode = false;

  private audio!: AudioEngine;

  private i18n!: I18n;

  private saveService!: SaveService;

  constructor() {
    super(SCENE.GAME);
  }

  create(data: GameSceneData): void {
    this.run = data.run;
    this.stage = STAGES[Math.min(this.run.stageIndex, STAGES.length - 1)];
    this.diff = DIFFICULTIES[this.run.difficulty];
    this.audio = this.registry.get('audio') as AudioEngine;
    this.i18n = this.registry.get('i18n') as I18n;
    this.saveService = this.registry.get('save') as SaveService;
    this.godMode = false;

    let seedBase: number = this.run.seed;
    if (__PD_DEBUG_HOOKS__ || import.meta.env.DEV) {
      const url = new URL(window.location.href);
      const seedParam = url.searchParams.get('seed');
      if (seedParam !== null && /^[0-9a-f]+$/i.test(seedParam)) {
        seedBase = Number.parseInt(seedParam, 16) >>> 0;
      }
    }
    this.rng = new SeededRandom((seedBase + this.run.stageIndex * 7919) >>> 0);

    this.scoreState = createScoreState();
    this.stageElapsedMs = 0;
    this.accumulatorMs = 0;
    this.enemies = [];
    this.boss = null;
    this.bossWaveSeen = false;
    this.finalBossSpawned = false;
    this.processedMidbossIds.clear();
    this.bossDeathPendingMs = 0;
    this.stageCompleted = false;
    this.gameOverStarted = false;
    this.respawnCountdownMs = 0;
    this.bombCooldownMs = 0;

    this.background = new ParallaxBackground(this, this.stage.theme);
    this.playerBullets = new PlayerBulletPool(this);
    this.enemyBullets = new EnemyBulletPool(this);
    this.itemsMan = new ItemManager(this);

    const ship = getShip(this.run.shipId);
    this.player = new PlayerShip(this, ship);
    this.player.respawnAt(GAME_WIDTH / 2, GAME_HEIGHT - 150);
    if (this.run.hasShield) this.player.setShield(true);

    this.waveRunner = new WaveRunner(this.stage.waves);

    this.hud = new Hud(
      this,
      this.saveService.data.hiscores[this.run.difficulty],
      this.i18n.t(this.stage.nameKey as LocaleKey),
      `ship_${ship.id}`,
    );
    this.refreshHud();

    this.setupInput();
    this.setupTouchUi();

    this.events.once('shutdown', this.cleanup, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.autoPause, this);
    this.events.once('destroy', () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.autoPause, this);
    });

    this.audio.startMusic(this.stage.theme === 'dawn' ? 'dawn' : 'ember');

    if (__PD_DEBUG_HOOKS__ || import.meta.env.DEV) {
      installDebugHooks(this);
    }
  }

  private get fireContext(): EnemyFireContext {
    return {
      spawnBullets: (spawns, tint) => this.enemyBullets.spawnMany(spawns, tint),
      playerPos: () => ({ x: this.player.x, y: this.player.y }),
      rng: this.rng,
      bulletSpeedMult: this.diff.bulletSpeedMult,
    };
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (keyToPause(event.code)) {
        event.preventDefault();
        this.togglePause();
        return;
      }
      const cmd = keyToGameCommand(event.code);
      if (!cmd) return;
      event.preventDefault();
      if (cmd === 'bomb') {
        this.tryBomb();
        return;
      }
      this.pressedCommands.add(cmd);
      if (cmd === 'focus') this.focused = true;
    });
    this.input.keyboard?.on('keyup', (event: KeyboardEvent) => {
      const cmd = keyToGameCommand(event.code);
      if (!cmd) return;
      this.pressedCommands.delete(cmd);
      if (cmd === 'focus' && !this.touchMode) this.focused = false;
    });
  }

  private setupTouchUi(): void {
    this.touchMode =
      window.matchMedia('(pointer: coarse)').matches || this.sys.game.device.input.touch;
    this.input.addPointer(2);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.touchMode) return;
      if (p.x < GAME_WIDTH * 0.62 && p.y < GAME_HEIGHT - 150 && this.dragId === -1) {
        this.dragId = p.id;
        this.dragOrigin = { x: p.x, y: p.y - 70 };
        this.dragVector = { x: 0, y: 0 };
      }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.touchMode || p.id !== this.dragId) return;
      this.dragVector = relativeDragToVector(this.dragOrigin.x, this.dragOrigin.y, p.x, p.y, 90);
    });
    const releasePointer = (p: Phaser.Input.Pointer) => {
      if (p.id === this.dragId) {
        this.dragId = -1;
        this.dragVector = { x: 0, y: 0 };
      }
    };
    this.input.on('pointerup', releasePointer);
    this.pointerCancelHandler = () => {
      this.dragId = -1;
      this.dragVector = { x: 0, y: 0 };
    };
    this.game.canvas.addEventListener('pointercancel', this.pointerCancelHandler);

    if (this.touchMode) {
      this.bombButton = this.add
        .image(GAME_WIDTH - 64, GAME_HEIGHT - 96, 'item_bomb')
        .setScale(2)
        .setDepth(DEPTH.HUD)
        .setAlpha(0.9)
        .setInteractive({ useHandCursor: true });
      this.bombButton.on('pointerdown', () => this.tryBomb());
      this.focusButtonImg = this.add
        .image(GAME_WIDTH - 152, GAME_HEIGHT - 80, 'item_shield')
        .setScale(1.4)
        .setDepth(DEPTH.HUD)
        .setAlpha(0.55)
        .setInteractive({ useHandCursor: true });
      this.focusButtonImg.on('pointerdown', () => {
        this.focused = !this.focused;
        this.focusButtonImg?.setAlpha(this.focused ? 1 : 0.55);
      });
      this.events.once('shutdown', () => {
        this.bombButton?.destroy();
        this.focusButtonImg?.destroy();
      });
    }
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 100);
    this.background.update(dt);
    this.accumulatorMs += dt;
    let steps = 0;
    while (this.accumulatorMs >= FIXED_STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      this.step(FIXED_STEP_MS);
      this.accumulatorMs -= FIXED_STEP_MS;
      steps += 1;
    }
    if (steps === MAX_STEPS_PER_FRAME) this.accumulatorMs = 0;
  }

  private step(dtMs: number): void {
    if (this.stageCompleted || this.gameOverStarted) return;
    this.stageElapsedMs += dtMs;
    this.bombCooldownMs = Math.max(0, this.bombCooldownMs - dtMs);
    this.pollGamepad();

    tickScore(this.scoreState, this.stageElapsedMs, SCORE_CONFIG);
    this.updatePlayer(dtMs);

    for (const ev of this.waveRunner.update(dtMs)) this.handleWaveEvent(ev);

    for (const enemy of this.enemies) enemy.update(dtMs);
    this.compactEnemies();

    this.boss?.update(dtMs);
    if (this.boss?.defeated) {
      this.bossDeathPendingMs += dtMs;
      if (this.bossDeathPendingMs > 1600) {
        this.clearBoss();
      }
    }

    this.playerBullets.update(dtMs);
    this.enemyBullets.update(dtMs, (spawns) => this.enemyBullets.spawnMany(spawns, 0xc98cff));
    for (const c of this.itemsMan.update(dtMs, { x: this.player.x, y: this.player.y })) {
      this.collectItem(c.kind);
    }

    this.handleCollisions();
    this.checkStageCompletion();
    this.refreshHud();
  }

  private pollGamepad(): void {
    const gp = this.input.gamepad;
    const pad = gp?.getPad(0);
    if (!pad) {
      this.padState = null;
      return;
    }
    const snap = snapshotPad(pad as unknown as PhaserLikePad);
    const state = mapPad(snap.axes, snap.btn);
    if (state.bomb && !this.padBombPrev) {
      this.tryBomb();
    }
    if (state.pause && !this.padPausePrev) {
      this.togglePause();
    }
    this.padBombPrev = state.bomb;
    this.padPausePrev = state.pause;
    this.padState = state;
  }

  private updatePlayer(dtMs: number): void {
    if (!this.player.isAlive) {
      if (this.respawnCountdownMs > 0) {
        this.respawnCountdownMs -= dtMs;
        if (this.respawnCountdownMs <= 0 && this.run.lives >= 0) {
          this.player.respawnAt(GAME_WIDTH / 2, GAME_HEIGHT - 150);
          this.player.grantSafetyInvuln();
          this.enemyBullets.clearRadius(GAME_WIDTH / 2, GAME_HEIGHT - 150, 180);
        }
      }
      return;
    }
    const vec = this.currentMoveVector();
    const padFiring = this.padState?.fire ?? false;
    const firing = this.touchMode || padFiring ? true : this.pressedCommands.has('fire');
    const focusedNow = this.focused || (this.padState?.focus ?? false);
    this.player.update(
      dtMs,
      { vx: vec.x, vy: vec.y, focused: focusedNow, firing },
      (levelIdx) => this.firePlayer(levelIdx),
      this.run.power,
    );
  }

  private currentMoveVector(): { x: number; y: number } {
    if (this.touchMode) {
      if (this.padState && (this.padState.mx !== 0 || this.padState.my !== 0)) {
        return { x: this.padState.mx, y: this.padState.my };
      }
      return this.dragVector;
    }
    const pad = this.padState;
    const px = pad?.mx ?? 0;
    const py = pad?.my ?? 0;
    if (px !== 0 || py !== 0) {
      return { x: px, y: py };
    }
    let x = 0;
    let y = 0;
    if (this.pressedCommands.has('left')) x -= 1;
    if (this.pressedCommands.has('right')) x += 1;
    if (this.pressedCommands.has('up')) y -= 1;
    if (this.pressedCommands.has('down')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  private firePlayer(levelIdx: number): void {
    const ship = getShip(this.run.shipId);
    for (const shot of ship.weapon[levelIdx].shots) {
      const angleRad = ((shot.angleDeg - 90) * Math.PI) / 180;
      this.playerBullets.spawn(
        this.player.x,
        this.player.y,
        angleRad,
        780,
        shot.damage,
        shot.pierce ?? false,
        shot.offsetX,
        shot.offsetY,
      );
    }
    this.audio.play('shoot');
  }

  private tryBomb(): void {
    if (
      this.bombCooldownMs > 0 ||
      !this.player.isAlive ||
      this.run.bombs <= 0 ||
      this.stageCompleted ||
      this.gameOverStarted
    ) {
      return;
    }
    this.bombCooldownMs = 900;
    this.run.bombs -= 1;
    this.audio.play('bomb');
    const ship = getShip(this.run.shipId);
    const radius = ship.bombRadius;
    const cx = this.player.x;
    const cy = this.player.y;

    this.enemyBullets.clearRadius(cx, cy, radius);

    for (const enemy of this.enemies) {
      const dx = enemy.x - cx;
      const dy = enemy.y - cy;
      if (dx * dx + dy * dy <= (radius + enemy.radius) ** 2) {
        this.damageEnemy(enemy, ship.bombDamage);
      }
    }
    if (this.boss && !this.boss.isDying) {
      for (let i = 0; i < 8; i++) {
        const px = cx + Math.cos((i / 8) * Math.PI * 2) * radius * 0.45;
        const py = cy + Math.sin((i / 8) * Math.PI * 2) * radius * 0.45;
        const applied = this.boss.takeDamageAt(ship.bombDamage / 3, px, py);
        if (applied > 0) break;
      }
    }

    const ring = this.add.image(cx, cy, 'fx_ring').setDepth(DEPTH.EFFECT).setScale(0.5);
    this.tweens.add({
      targets: ring,
      scale: (radius * 2) / 96 + 1,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
    if (this.saveService.data.settings.screenShake) {
      this.cameras.main.shake(420, 0.008);
    }
    if (!this.saveService.data.settings.reduceFlash) {
      const flash = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.3)
        .setDepth(DEPTH.OVERLAY);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 260,
        onComplete: () => flash.destroy(),
      });
    }
  }

  private handleWaveEvent(ev: WaveEvent): void {
    if (ev.bannerKey) {
      this.showBanner(ev.bannerKey as LocaleKey);
      this.audio.play('bossWarn');
    }
    for (const action of ev.spawns) {
      for (let i = 0; i < action.count; i++) {
        const spacing = action.spacingPx ?? 0;
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2) * spacing * 0.55;
        const spawnY = action.yFrac !== undefined ? action.yFrac * GAME_HEIGHT : -(46 + row);
        this.spawnEnemy(action.enemyId, action.xFrac * GAME_WIDTH + side * spacing * 0.5, spawnY);
      }
    }
    if (ev.bossId && !this.bossWaveSeen) {
      if (ev.bossId !== this.stage.midBossId) {
        this.bossWaveSeen = true;
      } else {
        this.processedMidbossIds.add(ev.bossId);
      }
      const isFinalBoss = ev.bossId === this.stage.finalBossId;
      this.time.delayedCall(isFinalBoss ? 1800 : 1400, () => {
        if (!this.scene.isActive()) return;
        if (isFinalBoss) {
          this.spawnFinalBoss(ev.bossId!);
        } else {
          const midboss = new Enemy(this, this.fireContext, {
            defId: ev.bossId!,
            hpMult: this.diff.bossHpMult * 1.5,
            fireIntervalMult: this.diff.fireIntervalMult,
          });
          midboss.sprite.setPosition(GAME_WIDTH / 2, -60);
          midboss.sprite.setScale(1.5);
          this.enemies.push(midboss);
        }
      });
    }
  }

  private processedMidbossIds = new Set<string>();

  private spawnEnemy(enemyId: string, x: number, y: number): void {
    const enemy = new Enemy(this, this.fireContext, {
      defId: enemyId,
      fireIntervalMult: this.diff.fireIntervalMult,
    });
    enemy.sprite.setPosition(x, y);
    this.enemies.push(enemy);
  }

  private spawnFinalBoss(bossId: string): void {
    const api: BossApi = {
      spawnBullets: (spawns, tint) => this.enemyBullets.spawnMany(spawns, tint),
      playerPos: () => ({ x: this.player.x, y: this.player.y }),
      rng: this.rng,
      bulletSpeedMult: this.diff.bulletSpeedMult,
      fireIntervalMult: this.diff.fireIntervalMult,
      shake: (intensity, durationMs) => {
        if (this.saveService.data.settings.screenShake) {
          this.cameras.main.shake(durationMs, intensity);
        }
      },
      sfx: (name: SfxName) => this.audio.play(name),
      summonEnemy: (defId, xFrac) => this.spawnEnemy(defId, xFrac * GAME_WIDTH, -40),
    };
    this.audio.startMusic('boss');
    this.boss =
      bossId === 'solbreaker'
        ? new SolbreakerBoss(this, api, this.diff.bossHpMult)
        : new EmberCrownBoss(this, api, this.diff.bossHpMult);
    this.finalBossSpawned = true;
  }

  private clearBoss(): void {
    this.boss?.destroy();
    this.boss = null;
    this.enemyBullets.clearAll(true);
  }

  private handleCollisions(): void {
    const shots = this.playerBullets.active;
    for (let si = shots.length - 1; si >= 0; si--) {
      const shot = shots[si];
      let consumed = false;
      for (const enemy of this.enemies) {
        if (!enemy.active()) continue;
        const dx = enemy.x - shot.img.x;
        const dy = enemy.y - shot.img.y;
        const rr = enemy.radius + 5;
        if (dx * dx + dy * dy <= rr * rr) {
          this.damageEnemy(enemy, shot.damage);
          consumed = true;
          break;
        }
      }
      if (!consumed && this.boss && this.boss.isEntered && !this.boss.isDying) {
        const applied = this.boss.takeDamageAt(shot.damage, shot.img.x, shot.img.y);
        if (applied > 0) {
          consumed = true;
          this.audio.play('enemyHit');
        }
      }
      if (consumed) {
        shot.hitsLeft -= 1;
        if (shot.hitsLeft <= 0) this.playerBullets.recycle(si);
      }
    }

    if (!this.player.isAlive || this.player.invulnerable || this.godMode) return;
    const pr = this.player.radius;
    this.enemyBullets.forEachInRadius(this.player.x, this.player.y, 34, (b) => {
      if (b.grazed) return;
      const dx = b.img.x - this.player.x;
      const dy = b.img.y - this.player.y;
      const d2 = dx * dx + dy * dy;
      const grazeR = GRAZE_RADIUS_PX + pr;
      if (d2 < grazeR * grazeR && d2 > (pr + b.radius) ** 2) {
        b.grazed = true;
        registerGraze(this.scoreState, GRADE_GRAZE_POINTS);
      }
    });
    for (const b of this.enemyBullets.active) {
      const dx = b.img.x - this.player.x;
      const dy = b.img.y - this.player.y;
      const rr = pr + b.radius;
      if (dx * dx + dy * dy <= rr * rr) {
        this.killPlayer();
        return;
      }
    }
    for (const enemy of this.enemies) {
      if (!enemy.active()) continue;
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const rr = pr + enemy.radius * 0.85;
      if (dx * dx + dy * dy <= rr * rr) {
        this.damageEnemy(enemy, 40);
        this.killPlayer();
        return;
      }
    }
    if (this.boss && this.boss.isEntered && !this.boss.isDying) {
      for (const hz of this.boss.hazards()) {
        if (Math.abs(this.player.x - hz.x) <= hz.halfWidth + pr && this.player.y >= hz.yTop) {
          this.killPlayer();
          return;
        }
      }
      for (const c of this.boss.hitCircles()) {
        const dx = this.player.x - c.x;
        const dy = this.player.y - c.y;
        const rr = pr + c.r * 0.9;
        if (dx * dx + dy * dy <= rr * rr) {
          this.killPlayer();
          return;
        }
      }
    }
  }

  private damageEnemy(enemy: Enemy, amount: number): void {
    const killed = enemy.takeDamage(amount);
    if (killed) {
      this.explodeAt(enemy.x, enemy.y, enemy.def.elite ? 'big' : 'small');
      registerKill(this.scoreState, enemy.def.score, this.stageElapsedMs, SCORE_CONFIG);
      for (const entry of enemy.def.drop.entries) {
        if (entry.chance >= 1 || this.rng.next() < entry.chance) {
          this.itemsMan.spawn(entry.item, enemy.x, enemy.y);
        }
      }
      if (enemy.def.drop.medalCount > 0) {
        this.itemsMan.spawn('medal', enemy.x, enemy.y, enemy.def.drop.medalCount);
      }
    } else {
      this.audio.play('enemyHit');
    }
  }

  private collectItem(kind: string): void {
    switch (kind) {
      case 'power':
        if (this.run.power >= 3) {
          this.run.score += 1000;
          this.showToast(this.i18n.t('item.powerMax'));
        } else {
          this.run.power += 1;
        }
        this.audio.play('pickupPower');
        break;
      case 'bomb':
        this.run.bombs = Math.min(6, this.run.bombs + 1);
        this.audio.play('pickupUtility');
        break;
      case 'shield':
        this.run.hasShield = true;
        this.player.setShield(true);
        this.audio.play('pickupUtility');
        break;
      case 'medal':
        registerItemPickup(this.scoreState, 300, this.stageElapsedMs);
        this.audio.play('pickupMedal');
        break;
      default:
        break;
    }
  }

  private showToast(message: string): void {
    const toast = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, message, {
        fontFamily: FONT_STACK,
        fontSize: '20px',
        color: '#ffd75e',
        stroke: '#00000099',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.EFFECT);
    this.tweens.add({
      targets: toast,
      y: toast.y - 46,
      alpha: 0,
      duration: 1100,
      ease: 'Quad.Out',
      onComplete: () => toast.destroy(),
    });
  }

  private killPlayer(): void {
    if (!this.player.isAlive || this.player.invulnerable || this.godMode) return;
    if (this.run.hasShield) {
      this.run.hasShield = false;
      this.player.setShield(false);
      this.player.grantSafetyInvuln();
      this.audio.play('shieldBreak');
      const ring = this.add
        .image(this.player.x, this.player.y, 'fx_ring')
        .setDepth(DEPTH.EFFECT)
        .setTint(0x7edcb4);
      this.tweens.add({
        targets: ring,
        scale: 2.2,
        alpha: 0,
        duration: 380,
        onComplete: () => ring.destroy(),
      });
      return;
    }
    this.run.lives -= 1;
    this.run.power = Math.max(1, this.run.power - 1);
    this.run.hasShield = false;
    this.explodeAt(this.player.x, this.player.y, 'big');
    this.audio.play('playerHit');
    if (this.saveService.data.settings.screenShake) {
      this.cameras.main.shake(320, 0.01);
    }
    this.player.kill();
    if (this.run.lives < 0) {
      this.beginGameOver();
    } else {
      this.respawnCountdownMs = PLAYER_RESPAWN_MS;
    }
  }

  private beginGameOver(): void {
    if (this.gameOverStarted) return;
    this.gameOverStarted = true;
    this.time.delayedCall(1000, () => {
      this.scene.start(SCENE.RESULT, {
        won: false,
        run: { ...this.run },
        grazeCount: this.scoreState.grazeCount,
        maxCombo: this.scoreState.bestCombo,
        newRecord: false,
      });
    });
  }

  private checkStageCompletion(): void {
    if (this.stageCompleted || this.gameOverStarted) return;
    if (!this.waveRunner.finished) return;
    if (this.enemies.some((e) => e.active())) return;
    if (this.boss !== null && !this.boss.defeated) return;
    if (!this.bossWaveSeen) {
      this.completeStage();
      return;
    }
    if (this.finalBossSpawned && this.boss === null) {
      this.completeStage();
    }
  }

  private completeStage(): void {
    this.stageCompleted = true;
    const livesBonus = this.run.lives * 10000;
    const bombsBonus = this.run.bombs * 5000;
    const flightBonus = 20000;
    const totalBonus = Math.round((livesBonus + bombsBonus + flightBonus) * this.diff.scoreMult);
    this.run.score += totalBonus;
    this.saveService.recordStageClear(Math.min(this.run.stageIndex + 1, 2));
    const isFinal = this.run.stageIndex >= STAGES.length - 1;
    this.time.delayedCall(900, () => {
      if (isFinal) {
        this.saveService.recordStageClear(2);
        this.scene.start(SCENE.RESULT, {
          won: true,
          run: { ...this.run },
          grazeCount: this.scoreState.grazeCount,
          maxCombo: this.scoreState.bestCombo,
          newRecord: false,
        });
      } else {
        this.run.stageIndex += 1;
        this.scene.launch(SCENE.STAGE_CLEAR, {
          result: {
            livesBonus: Math.round(livesBonus * this.diff.scoreMult),
            bombsBonus: Math.round(bombsBonus * this.diff.scoreMult),
            flightBonus: Math.round(flightBonus * this.diff.scoreMult),
            totalBonus,
            isFinalStage: false,
          },
          run: this.run,
        });
        this.scene.pause();
      }
    });
  }

  private explodeAt(x: number, y: number, size: 'small' | 'big'): void {
    this.audio.play(size === 'big' ? 'explodeBig' : 'explodeSmall');
    const count = size === 'big' ? 16 : 8;
    const emitter = this.add.particles(x, y, 'p_spark', {
      speed: { min: size === 'big' ? 120 : 70, max: size === 'big' ? 340 : 190 },
      lifespan: { min: 240, max: 620 },
      quantity: count,
      scale: { start: size === 'big' ? 1.6 : 1, end: 0 },
      tint: [0xffd75e, 0xf2a35c, 0xe8734a],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(DEPTH.EFFECT);
    emitter.explode(count);
    this.time.delayedCall(800, () => emitter.destroy());
    const ring = this.add
      .image(x, y, 'fx_ring')
      .setDepth(DEPTH.EFFECT)
      .setScale(size === 'big' ? 0.4 : 0.22);
    this.tweens.add({
      targets: ring,
      scale: size === 'big' ? 2.6 : 1.1,
      alpha: 0,
      duration: 430,
      ease: 'Quad.Out',
      onComplete: () => ring.destroy(),
    });
  }

  private showBanner(key: LocaleKey): void {
    this.bannerText?.destroy();
    this.bannerText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.36, this.i18n.t(key), {
        fontFamily: FONT_STACK,
        fontSize: '38px',
        color: '#ffd75e',
        stroke: '#000000cc',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY)
      .setAlpha(0);
    this.tweens.add({
      targets: this.bannerText,
      alpha: 1,
      duration: 260,
      yoyo: true,
      hold: 1300,
      onComplete: () => {
        this.bannerText?.destroy();
        this.bannerText = undefined;
      },
    });
  }

  private refreshHud(): void {
    this.hud.updateScore(this.run.score + this.scoreState.score);
    this.hud.updateLives(Math.max(0, this.run.lives));
    this.hud.updateBombs(this.run.bombs);
    this.hud.updatePower(this.run.power);
    this.hud.updateCombo(this.scoreState.combo, this.scoreState.multiplier);
    if (this.boss && this.boss.isEntered && !this.boss.defeated) {
      const frac =
        this.boss instanceof EmberCrownBoss ? this.boss.displayHpFraction() : this.boss.hpFraction;
      this.hud.showBossBar(frac);
    } else {
      this.hud.hideBossBar();
    }
  }

  togglePause(): void {
    if (!this.scene.isActive() || this.stageCompleted || this.gameOverStarted) return;
    this.audio.suspend();
    this.scene.launch(SCENE.PAUSE, { from: SCENE.GAME });
    this.scene.pause();
  }

  private autoPause(): void {
    this.togglePause();
  }

  private compactEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].alive) {
        this.enemies[i].sprite.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  private cleanup(): void {
    this.game.events.off(Phaser.Core.Events.HIDDEN, this.autoPause, this);
    if (this.pointerCancelHandler) {
      this.game.canvas.removeEventListener('pointercancel', this.pointerCancelHandler);
      this.pointerCancelHandler = null;
    }
    this.audio.stopMusic();
    this.enemyBullets.destroy();
    this.playerBullets.destroy();
    this.itemsMan.destroy();
    this.background.destroy();
    this.hud.destroy();
    this.player.destroy();
    this.boss?.destroy();
    this.boss = null;
    this.enemies = [];
  }
}

interface DebugStats {
  score: number;
  lives: number;
  bombs: number;
  power: number;
  stageIndex: number;
  bossActive: boolean;
  bullets: number;
  enemies: number;
  stageElapsedSec: number;
  playerX: number;
  playerY: number;
  playerAlive: boolean;
  waveFinished: boolean;
  bossWaveSeen: boolean;
  finalBossSpawned: boolean;
  bossEntered: boolean;
}

function installDebugHooks(scene: GameScene): void {
  const g = scene as unknown as {
    run: RunState;
    scoreState: { score: number; grazeCount: number; bestCombo: number };
    enemyBullets: { count: number };
    enemies: Enemy[];
    boss: BossBase | null;
    stageElapsedMs: number;
    waveRunner: WaveRunner;
    godMode: boolean;
    stage: StageDef;
    touchMode: boolean;
    player: PlayerShip;
    dragId: number;
    dragVector: { x: number; y: number };
    bossWaveSeen: boolean;
    finalBossSpawned: boolean;
    bossEntered: boolean;
    beginGameOver(): void;
    completeStage(): void;
  };
  const api = {
    sceneKey: SCENE.GAME,
    getTouchUi(): boolean {
      return g.touchMode;
    },
    getDrag(): { id: number; x: number; y: number } {
      return { id: g.dragId, x: g.dragVector.x, y: g.dragVector.y };
    },
    setDrag(id: number, x: number, y: number): void {
      g.dragId = id;
      g.dragVector = { x, y };
    },
    clearDrag(): void {
      g.dragId = -1;
      g.dragVector = { x: 0, y: 0 };
    },
    getStats(): DebugStats {
      return {
        score: g.run.score + g.scoreState.score,
        lives: g.run.lives,
        bombs: g.run.bombs,
        power: g.run.power,
        stageIndex: g.run.stageIndex,
        bossActive: g.boss !== null,
        bullets: g.enemyBullets.count,
        enemies: g.enemies.length,
        stageElapsedSec: g.stageElapsedMs / 1000,
        playerX: g.player.x,
        playerY: g.player.y,
        playerAlive: g.player.isAlive,
        waveFinished: g.waveRunner.finished,
        bossWaveSeen: g.bossWaveSeen,
        finalBossSpawned: g.finalBossSpawned,
        bossEntered: g.boss?.isEntered ?? false,
      };
    },
    toggleGod(): boolean {
      g.godMode = !g.godMode;
      return g.godMode;
    },
    grantResources(): void {
      g.run.lives = Math.max(g.run.lives, 2);
      g.run.bombs = 6;
      g.run.power = 3;
    },
    warpToBoss(): void {
      const remaining = g.stage.waves.filter((w) => w.bossId === g.stage.finalBossId)[0];
      if (remaining) {
        g.waveRunner.skipTo(remaining.atSec * 1000 - 1);
      }
    },
    enemyInfo(): Array<{ id: string; x: number; y: number; moveT: number }> {
      return g.enemies.map((e) => ({
        id: e.def.id,
        x: Math.round(e.x),
        y: Math.round(e.y),
        moveT: Math.round(e['moveT'] * 10) / 10,
      }));
    },
    smashBoss(): boolean {
      const boss = g.boss;
      if (!boss || boss.isDying) return false;
      const isCrown = boss instanceof EmberCrownBoss;
      let attempt = 0;
      while (!boss.isDying && attempt < 16) {
        const targetX = isCrown && attempt < 2 ? boss.x + (attempt === 0 ? -125 : 125) : boss.x;
        boss.takeDamageAt(999999, targetX, boss.y + 62);
        attempt += 1;
      }
      return boss.isDying;
    },
    forceGameOver(): void {
      g.run.lives = -1;
      g.beginGameOver();
    },
    completeStageNow(): void {
      g.completeStage();
    },
  };
  (window as unknown as Record<string, unknown>).__PD_API__ = api;
}
