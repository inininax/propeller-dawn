import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/constants';
import { formatScore } from '../systems/score';
import type { I18n } from '../systems/locale/i18n';
import type { LocaleKey } from '../systems/locale/en';
import type { GameButton } from './widgets';
import { FONT_STACK } from './widgets';

export interface MenuNavCallbacks {
  onMove(): void;
  onSelect(index: number): void;
}

export class MenuList {
  private index = 0;

  constructor(
    private readonly buttons: GameButton[],
    private readonly callbacks: MenuNavCallbacks,
    private wrap = true,
  ) {
    this.updateFocus();
  }

  move(delta: number): void {
    if (this.buttons.length === 0) return;
    let next = this.index + delta;
    if (this.wrap) {
      next = (next + this.buttons.length) % this.buttons.length;
    } else {
      next = Phaser.Math.Clamp(next, 0, this.buttons.length - 1);
    }
    if (next !== this.index) {
      this.index = next;
      this.updateFocus();
      this.callbacks.onMove();
    }
  }

  selectCurrent(): void {
    const btn = this.buttons[this.index];
    if (!btn) return;
    if (btn.container.input?.enabled) {
      btn.select();
      this.callbacks.onSelect(this.index);
    }
  }

  setIndex(i: number): void {
    this.index = Phaser.Math.Clamp(i, 0, this.buttons.length - 1);
    this.updateFocus();
  }

  refreshFocus(): void {
    this.updateFocus();
  }

  get currentIndex(): number {
    return this.index;
  }

  private updateFocus(): void {
    this.buttons.forEach((b, i) => b.setFocused(i === this.index));
  }
}

export class Hud {
  private readonly i18n: I18n;

  private readonly scoreText: Phaser.GameObjects.Text;

  private readonly hiText: Phaser.GameObjects.Text;

  private readonly stageText: Phaser.GameObjects.Text;

  private readonly livesLabel: Phaser.GameObjects.Text;

  private readonly livesIcons: Phaser.GameObjects.Image[] = [];

  private readonly bombsLabel: Phaser.GameObjects.Text;

  private readonly bombIcons: Phaser.GameObjects.Image[] = [];

  private readonly powerText: Phaser.GameObjects.Text;

  private readonly comboText: Phaser.GameObjects.Text;

  private bossBarBg?: Phaser.GameObjects.Rectangle;

  private bossBarFill?: Phaser.GameObjects.Rectangle;

  private lastComboShown = -1;

  constructor(scene: Phaser.Scene, hiScore: number, stageLabel: string, shipTextureKey: string) {
    this.i18n = scene.registry.get('i18n') as I18n;
    const depth = 100;
    this.scoreText = scene.add
      .text(16, 10, '', { fontFamily: FONT_STACK, fontSize: '24px', color: '#ffffff' })
      .setDepth(depth);
    this.hiText = scene.add
      .text(16, 40, `${formatScore(hiScore)}`, {
        fontFamily: FONT_STACK,
        fontSize: '15px',
        color: '#f2a35c',
      })
      .setDepth(depth);
    this.stageText = scene.add
      .text(GAME_WIDTH - 14, 12, stageLabel, {
        fontFamily: FONT_STACK,
        fontSize: '13px',
        color: '#8fa3c7',
      })
      .setOrigin(1, 0)
      .setDepth(depth);

    this.livesLabel = scene.add
      .text(16, GAME_HEIGHT - 66, 'LIVES', {
        fontFamily: FONT_STACK,
        fontSize: '12px',
        color: '#8fa3c7',
      })
      .setDepth(depth);
    for (let i = 0; i < 6; i++) {
      this.livesIcons.push(
        scene.add
          .image(22 + i * 30, GAME_HEIGHT - 42, shipTextureKey)
          .setScale(0.55)
          .setDepth(depth),
      );
    }

    this.bombsLabel = scene.add
      .text(210, GAME_HEIGHT - 66, 'BOMB', {
        fontFamily: FONT_STACK,
        fontSize: '12px',
        color: '#8fa3c7',
      })
      .setDepth(depth);
    for (let i = 0; i < 6; i++) {
      this.bombIcons.push(
        scene.add
          .image(216 + i * 26, GAME_HEIGHT - 42, 'item_bomb')
          .setScale(0.72)
          .setDepth(depth),
      );
    }

    this.powerText = scene.add
      .text(GAME_WIDTH - 14, GAME_HEIGHT - 50, '', {
        fontFamily: FONT_STACK,
        fontSize: '18px',
        color: '#ffd75e',
      })
      .setOrigin(1, 0.5)
      .setDepth(depth);

    this.comboText = scene.add
      .text(GAME_WIDTH - 20, 200, '', {
        fontFamily: FONT_STACK,
        fontSize: '26px',
        color: '#ffd75e',
        stroke: '#00000088',
        strokeThickness: 4,
      })
      .setOrigin(1, 0.5)
      .setDepth(depth);
  }

  updateScore(score: number): void {
    this.scoreText.setText(formatScore(score));
  }

  setHiScore(score: number): void {
    this.hiText.setText(`${formatScore(score)}`);
  }

  updateLives(lives: number): void {
    this.livesIcons.forEach((img, i) => img.setVisible(i < lives));
  }

  updateBombs(bombs: number): void {
    this.bombIcons.forEach((img, i) => img.setVisible(i < bombs));
  }

  updatePower(power: number): void {
    this.powerText.setText(
      `${this.t('hud.power')} ${'●'.repeat(power)}${'○'.repeat(Math.max(0, 3 - power))}`,
    );
  }

  updateCombo(combo: number, multiplier: number): void {
    if (combo !== this.lastComboShown) {
      this.lastComboShown = combo;
      if (combo >= 5) {
        this.comboText.setText(`${combo} ${this.t('hud.combo')} ×${multiplier.toFixed(1)}`);
        this.comboText.setScale(1.25);
        this.comboText.scene.tweens.killTweensOf(this.comboText);
        this.comboText.scene.tweens.add({
          targets: this.comboText,
          scale: 1,
          duration: 160,
          ease: 'Quad.Out',
        });
      } else {
        this.comboText.setText('');
      }
    }
  }

  showBossBar(fraction: number): void {
    if (!this.bossBarBg || !this.bossBarFill) {
      const scene = this.scoreText.scene;
      this.bossBarBg = scene.add
        .rectangle(GAME_WIDTH / 2, 74, GAME_WIDTH - 60, 12, 0x101828, 0.85)
        .setDepth(100);
      this.bossBarFill = scene.add
        .rectangle(GAME_WIDTH / 2 - (GAME_WIDTH - 64) / 2 + 2, 74, 1, 8, 0xc9553e, 1)
        .setOrigin(0, 0.5)
        .setDepth(101);
    }
    this.bossBarBg.setVisible(true);
    this.bossBarFill.setVisible(true);
    const maxW = GAME_WIDTH - 64;
    this.bossBarFill.width = Math.max(2, maxW * fraction);
  }

  hideBossBar(): void {
    this.bossBarBg?.setVisible(false);
    this.bossBarFill?.setVisible(false);
  }

  private t(key: LocaleKey): string {
    return this.i18n.t(key);
  }

  destroy(): void {
    [
      this.scoreText,
      this.hiText,
      this.stageText,
      this.livesLabel,
      this.bombsLabel,
      this.powerText,
      this.comboText,
      ...this.livesIcons,
      ...this.bombIcons,
    ].forEach((o) => o.destroy());
    this.bossBarBg?.destroy();
    this.bossBarFill?.destroy();
  }
}
