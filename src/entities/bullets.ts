import type Phaser from 'phaser';
import type { BulletSpawn } from '../core/types';
import { generateSplit } from '../systems/patterns';

const WORLD_TOP = -60;
const WORLD_BOTTOM = 1020;
const WORLD_LEFT = -40;
const WORLD_RIGHT = 580;

export interface ActiveBullet {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  radius: number;
  grazed: boolean;
  splitAtMs: number;
  ageMs: number;
  splitCount: number;
  splitSpeed: number;
}

export class EnemyBulletPool {
  readonly active: ActiveBullet[] = [];

  private free: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly maxCount = 620,
  ) {}

  get count(): number {
    return this.active.length;
  }

  spawnMany(spawns: BulletSpawn[], tint: number): void {
    for (const s of spawns) this.spawn(s, tint);
  }

  spawn(s: BulletSpawn, tint: number): void {
    if (this.active.length >= this.maxCount) return;
    let img = this.free.pop();
    if (!img) {
      if (this.active.length + this.free.length >= this.maxCount) return;
      img = this.scene.add.image(0, 0, 'b_dot').setDepth(40);
    }
    const textureKey =
      s.kind === 'needle'
        ? 'b_needle'
        : s.kind === 'orb'
          ? 'b_orb'
          : s.kind === 'shard'
            ? 'b_shard'
            : 'b_dot';
    img.setTexture(textureKey);
    img.setTint(tint);
    img.setPosition(s.x, s.y);
    img.setRotation(textureKey === 'b_dot' ? 0 : Math.atan2(s.vy, s.vx) - Math.PI / 2);
    img.setVisible(true).setActive(true);
    this.active.push({
      img,
      vx: s.vx,
      vy: s.vy,
      radius: s.radius,
      grazed: false,
      splitAtMs: s.splitAtMs ?? 0,
      ageMs: 0,
      splitCount: s.splitCount ?? 0,
      splitSpeed: s.splitSpeed ?? 0,
    });
  }

  update(dtMs: number, onSplit: (spawns: BulletSpawn[]) => void): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const b = this.active[i];
      b.ageMs += dtMs;
      b.img.x += (b.vx * dtMs) / 1000;
      b.img.y += (b.vy * dtMs) / 1000;
      if (
        b.img.y < WORLD_TOP ||
        b.img.y > WORLD_BOTTOM ||
        b.img.x < WORLD_LEFT ||
        b.img.x > WORLD_RIGHT
      ) {
        this.recycle(i);
        continue;
      }
      if (b.splitAtMs > 0 && b.ageMs >= b.splitAtMs) {
        const splits = generateSplit({
          x: b.img.x,
          y: b.img.y,
          vx: b.vx,
          vy: b.vy,
          kind: 'orb',
          radius: b.radius,
          splitCount: b.splitCount,
          splitSpeed: b.splitSpeed,
        });
        this.recycle(i);
        onSplit(splits);
      }
    }
  }

  forEachInRadius(cx: number, cy: number, r: number, fn: (b: ActiveBullet) => void): void {
    const r2 = r * r;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const b = this.active[i];
      const dx = b.img.x - cx;
      const dy = b.img.y - cy;
      if (dx * dx + dy * dy <= r2) fn(b);
    }
  }

  clearRadius(cx: number, cy: number, r: number): void {
    const r2 = r * r;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const b = this.active[i];
      const dx = b.img.x - cx;
      const dy = b.img.y - cy;
      if (dx * dx + dy * dy <= r2) this.recycle(i);
    }
  }

  clearAll(): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      this.recycle(i);
    }
  }

  recycle(index: number): void {
    const b = this.active[index];
    b.img.setVisible(false).setActive(false);
    this.free.push(b.img);
    const last = this.active.pop();
    if (last && index < this.active.length) {
      this.active[index] = last;
    }
  }

  destroy(): void {
    for (const b of this.active) b.img.destroy();
    for (const img of this.free) img.destroy();
    this.active.length = 0;
    this.free.length = 0;
  }
}

export interface PlayerShot {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  damage: number;
  pierce: boolean;
  hitsLeft: number;
}

export class PlayerBulletPool {
  readonly active: PlayerShot[] = [];

  private free: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly maxCount = 90,
  ) {}

  spawn(
    x: number,
    y: number,
    angleRad: number,
    speed: number,
    damage: number,
    pierce: boolean,
    offsetX = 0,
    offsetY = 0,
  ): void {
    if (this.active.length >= this.maxCount) return;
    let img = this.free.pop();
    if (!img) {
      img = this.scene.add.image(0, 0, 'p_shot').setDepth(30);
    }
    img.setTexture('p_shot');
    img.setTint(pierce ? 0xbfe8ff : 0xffffff);
    img.setPosition(x + offsetX, y + offsetY);
    img.setRotation(angleRad + Math.PI / 2);
    img.setVisible(true).setActive(true);
    this.active.push({
      img,
      vx: Math.cos(angleRad) * speed,
      vy: Math.sin(angleRad) * speed,
      damage,
      pierce,
      hitsLeft: pierce ? 2 : 1,
    });
  }

  update(dtMs: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const s = this.active[i];
      s.img.x += (s.vx * dtMs) / 1000;
      s.img.y += (s.vy * dtMs) / 1000;
      if (s.img.y < -30 || s.img.x < -30 || s.img.x > 570 || s.img.y > 1000) {
        this.recycle(i);
      }
    }
  }

  recycle(index: number): void {
    const s = this.active[index];
    s.img.setVisible(false).setActive(false);
    this.free.push(s.img);
    const last = this.active.pop();
    if (last && index < this.active.length) {
      this.active[index] = last;
    }
  }

  clearAll(): void {
    for (let i = this.active.length - 1; i >= 0; i--) this.recycle(i);
  }

  destroy(): void {
    for (const s of this.active) s.img.destroy();
    for (const img of this.free) img.destroy();
    this.active.length = 0;
    this.free.length = 0;
  }
}

export const BULLET_TINTS = {
  dawnFamily: 0xff7a5c,
  emberFamily: 0xffb02e,
  violetFamily: 0xc98cff,
  eliteFamily: 0xff5a6e,
} as const;
