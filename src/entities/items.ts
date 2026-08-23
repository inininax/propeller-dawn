import type Phaser from 'phaser';
import type { ItemKind } from '../core/types';

const ITEM_TEXTURE: Record<ItemKind, string> = {
  power: 'item_power',
  bomb: 'item_bomb',
  medal: 'item_medal',
  shield: 'item_shield',
};

interface ActiveItem {
  img: Phaser.GameObjects.Image;
  kind: ItemKind;
  vy: number;
  vx: number;
}

export class ItemManager {
  readonly active: ActiveItem[] = [];

  private free: Phaser.GameObjects.Image[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  spawn(kind: ItemKind, x: number, y: number, count = 1): void {
    for (let i = 0; i < count; i++) {
      let img = this.free.pop();
      if (!img) {
        img = this.scene.add.image(0, 0, ITEM_TEXTURE[kind]).setDepth(20);
      }
      img.setTexture(ITEM_TEXTURE[kind]);
      const spreadX = count > 1 ? (i - (count - 1) / 2) * 34 : 0;
      img.setPosition(x + spreadX, y);
      img.setVisible(true).setActive(true);
      this.active.push({
        img,
        kind,
        vy: -140 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 60,
      });
    }
  }

  update(
    dtMs: number,
    playerPos: { x: number; y: number },
  ): Array<{ kind: ItemKind; index: number }> {
    const collected: Array<{ kind: ItemKind; index: number }> = [];
    const dtSec = dtMs / 1000;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const item = this.active[i];
      if (item.vy < 40) {
        item.vy += 260 * dtSec;
      }
      const dx = playerPos.x - item.img.x;
      const dy = playerPos.y - item.img.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 130 * 130 && playerPos.y < item.img.y + 40) {
        const dist = Math.sqrt(distSq) || 1;
        const pull = 460 * dtSec;
        item.vx = (dx / dist) * pull * 8;
        item.vy = (dy / dist) * pull * 8;
      } else {
        item.vx *= 1 - 1.6 * dtSec;
      }
      item.img.x += item.vx * dtSec;
      item.img.y += item.vy * dtSec;
      item.img.y = Math.min(item.img.y, 990);
      if (distSq < 30 * 30) {
        collected.push({ kind: item.kind, index: i });
        this.recycle(i);
        continue;
      }
      if (item.img.y >= 989) {
        item.vy = 0;
        item.vx = 0;
        item.img.x += 26 * dtSec;
        if (item.img.x > 570) this.recycle(i);
      }
    }
    return collected;
  }

  private recycle(index: number): void {
    const item = this.active[index];
    item.img.setVisible(false).setActive(false);
    this.free.push(item.img);
    const last = this.active.pop();
    if (last && index < this.active.length) {
      this.active[index] = last;
    }
  }

  clearAll(): void {
    for (let i = this.active.length - 1; i >= 0; i--) this.recycle(i);
  }

  destroy(): void {
    for (const it of this.active) it.img.destroy();
    for (const img of this.free) img.destroy();
    this.active.length = 0;
    this.free.length = 0;
  }
}
