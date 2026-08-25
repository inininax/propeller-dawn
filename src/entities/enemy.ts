import type Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/constants';
import type { BulletSpawn, EnemyDef, MoveId, PatternContext } from '../core/types';
import { ENEMIES, MOVES } from '../data/enemies';
import { PATTERNS } from '../systems/patterns';
import type { SeededRandom } from '../core/rng';

export interface EnemyFireContext {
  spawnBullets(spawns: BulletSpawn[], tint: number): void;
  playerPos(): { x: number; y: number };
  rng: SeededRandom;
  bulletSpeedMult: number;
}

export interface EnemyOptions {
  x?: number;
  y?: number;
  defId: string;
  hpMult?: number;
  fireIntervalMult?: number;
  moveOverride?: MoveId;
}

export class Enemy {
  readonly sprite: Phaser.GameObjects.Image;

  readonly def: EnemyDef;

  hp: number;

  alive = true;

  private moveT = 0;

  private fireTimers: number[] = [];

  private readonly intervalMult: number;

  constructor(
    scene: Phaser.Scene,
    private readonly ctx: EnemyFireContext,
    opts: EnemyOptions,
  ) {
    this.def = ENEMIES[opts.defId];
    if (!this.def) throw new Error(`Unknown enemy ${opts.defId}`);
    this.def = opts.moveOverride ? { ...this.def, move: opts.moveOverride } : this.def;
    this.hp = Math.round(this.def.hp * (opts.hpMult ?? 1));
    this.intervalMult = opts.fireIntervalMult ?? 1;
    this.sprite = scene.add
      .image(opts.x ?? 0, opts.y ?? 0, `enemy_${opts.defId}`)
      .setDepth(this.def.elite ? 5 : 0);
    this.fireTimers = this.def.fire.map((f) => f.delayMs * this.intervalMult);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get radius(): number {
    return this.def.hitRadius;
  }

  update(dtMs: number): void {
    if (!this.alive) return;
    this.moveT += dtMs / 1000;
    this.applyMovement();
    this.updateFiring(dtMs);
  }

  private baseStart = { x: 0, y: -80 };

  private started = false;

  private applyMovement(): void {
    if (!this.started) {
      this.started = true;
      this.baseStart = { x: this.sprite.x, y: this.sprite.y };
    }
    const result = MOVES[this.def.move](this.moveT, this.baseStart.x, this.baseStart.y);
    this.sprite.x = result.x;
    this.sprite.y = result.y;
    this.sprite.setRotation(result.angleRad - Math.PI / 2);
    if (result.done) {
      this.alive = false;
      this.sprite.setVisible(false).setActive(false);
    }
  }

  private updateFiring(dtMs: number): void {
    if (
      this.sprite.y < -10 ||
      this.sprite.y > GAME_HEIGHT - 60 ||
      this.sprite.x < -10 ||
      this.sprite.x > GAME_WIDTH + 10
    ) {
      return;
    }
    for (let i = 0; i < this.def.fire.length; i++) {
      const fd = this.def.fire[i];
      this.fireTimers[i] -= dtMs;
      if (this.fireTimers[i] <= 0) {
        this.fireTimers[i] += fd.intervalMs * this.intervalMult;
        const gen = PATTERNS[fd.patternId];
        if (!gen) continue;
        const player = this.ctx.playerPos();
        const aimAngle = Math.atan2(player.y - this.sprite.y, player.x - this.sprite.x);
        const pctx: PatternContext = {
          x: this.sprite.x,
          y: this.sprite.y,
          aimAngleRad: aimAngle,
          timeMs: this.moveT * 1000,
          rng: this.ctx.rng,
        };
        const spawns = gen(pctx, scaleParams(fd.params ?? {}, this.ctx.bulletSpeedMult));
        for (const s of spawns) {
          s.y -= 6;
        }
        this.ctx.spawnBullets(spawns, this.def.elite ? 0xff5a6e : 0xff7a5c);
      }
    }
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0 && this.alive) {
      this.alive = false;
      this.sprite.setVisible(false).setActive(false);
      return true;
    }
    this.sprite.setTintFill(0xffffff);
    this.sprite.scene.time.delayedCall(40, () => {
      if (this.active()) this.sprite.clearTint();
    });
    return false;
  }

  active(): boolean {
    return this.alive && this.sprite.visible;
  }
}

function scaleParams(params: Record<string, number>, speedMult: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k] = k === 'speed' || k === 'splitSpeed' ? v * speedMult : v;
  }
  if (out.fieldWidth === undefined) out.fieldWidth = 540;
  return out;
}
