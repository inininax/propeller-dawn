import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PLAYER_SAFETY_INVULN_MS } from '../core/constants';
import type { ShipDef } from '../core/types';
import { applyFocusSpeed } from '../systems/input/commands';

export interface PlayerVisualConfig {
  screenShakeEnabled: boolean;
}

export class PlayerShip {
  readonly sprite: Phaser.GameObjects.Image;

  readonly hitboxDot: Phaser.GameObjects.Image;

  readonly shieldBubble: Phaser.GameObjects.Image;

  x = GAME_WIDTH / 2;

  y = GAME_HEIGHT - 140;

  alive = true;

  hasShield = false;

  private invulnMsRemaining = 0;

  private respawnTimerMs = 0;

  private fireCooldownMs = 0;

  private engineFlame: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly def: ShipDef,
    private focusFactor = 0.45,
  ) {
    this.sprite = scene.add.image(this.x, this.y, `ship_${def.id}`).setDepth(10);
    this.hitboxDot = scene.add.image(this.x, this.y, 'hitbox_dot').setDepth(12).setVisible(false);
    this.shieldBubble = scene.add
      .image(this.x, this.y, 'shield_bubble')
      .setDepth(11)
      .setVisible(false);
    this.engineFlame = scene.add.rectangle(this.x, this.y + 26, 6, 14, 0xf2a35c, 0.85).setDepth(9);
  }

  get isAlive(): boolean {
    return this.alive;
  }

  get invulnerable(): boolean {
    return this.invulnMsRemaining > 0;
  }

  get radius(): number {
    return this.def.hitRadius;
  }

  setShield(has: boolean): void {
    this.hasShield = has;
    this.shieldBubble.setVisible(has);
  }

  grantSafetyInvuln(): void {
    this.invulnMsRemaining = Math.max(this.invulnMsRemaining, PLAYER_SAFETY_INVULN_MS);
  }

  kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.respawnTimerMs = 1200;
    this.sprite.setVisible(false).setActive(false);
    this.hitboxDot.setVisible(false);
    this.shieldBubble.setVisible(false);
    this.engineFlame.setVisible(false);
  }

  respawnAt(x: number, y: number): void {
    this.alive = true;
    this.x = x;
    this.y = y;
    this.invulnMsRemaining = PLAYER_SAFETY_INVULN_MS;
    this.sprite.setPosition(x, y).setVisible(true).setActive(true).setAlpha(1);
    this.engineFlame.setVisible(true);
    if (this.hasShield) this.shieldBubble.setVisible(true);
  }

  update(
    dtMs: number,
    input: { vx: number; vy: number; focused: boolean; firing: boolean },
    fireFn: (levelIndex: number) => void,
    powerLevel: number,
  ): void {
    const dtSec = dtMs / 1000;
    if (this.invulnMsRemaining > 0) {
      this.invulnMsRemaining = Math.max(0, this.invulnMsRemaining - dtMs);
    }
    if (!this.alive) {
      this.respawnTimerMs -= dtMs;
      return;
    }

    const speed = applyFocusSpeed(this.def.speed, this.focusFactor, input.focused);
    this.x += input.vx * speed * dtSec;
    this.y += input.vy * speed * dtSec;
    this.x = Phaser.Math.Clamp(this.x, 20, GAME_WIDTH - 20);
    this.y = Phaser.Math.Clamp(this.y, 60, GAME_HEIGHT - 30);

    this.sprite.setPosition(this.x, this.y);
    this.sprite.setRotation(
      Math.sin(this.scene.time.now * 0.004) * 0.08 * Math.sign(input.vx || 1),
    );
    this.hitboxDot
      .setPosition(this.x, this.y)
      .setVisible(input.focused || this.invulnMsRemaining > 2000);
    this.shieldBubble.setPosition(this.x, this.y);
    if (this.hasShield) {
      this.shieldBubble.setAlpha(0.7 + Math.sin(this.scene.time.now * 0.01) * 0.25);
    }

    const flicker = 0.55 + Math.abs(Math.sin(this.scene.time.now * 0.03)) * 0.45;
    this.engineFlame.setPosition(this.x, this.y + 24 + (input.vy < 0 ? 4 : 0));
    this.engineFlame.setScale(1, input.focused ? 1.3 : 1);
    this.engineFlame.setAlpha(flicker);

    if (this.invulnMsRemaining > 0) {
      this.sprite.setAlpha(Math.floor(this.scene.time.now / 80) % 2 === 0 ? 0.35 : 0.9);
    } else {
      this.sprite.setAlpha(1);
    }

    this.fireCooldownMs -= dtMs;
    if (input.firing && this.fireCooldownMs <= 0) {
      const levelIdx = Phaser.Math.Clamp(powerLevel - 1, 0, 2);
      this.fireCooldownMs = this.def.weapon[levelIdx].intervalMs;
      fireFn(levelIdx);
    }
  }

  destroy(): void {
    this.sprite.destroy();
    this.hitboxDot.destroy();
    this.shieldBubble.destroy();
    this.engineFlame.destroy();
  }
}
