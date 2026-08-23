import Phaser from 'phaser';
import { DEPTH } from '../core/constants';

export const FONT_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export interface ButtonOptions {
  width?: number;
  height?: number;
  onSelect?: () => void;
  disabled?: boolean;
}

export class GameButton {
  readonly container: Phaser.GameObjects.Container;

  private readonly bg: Phaser.GameObjects.Graphics;

  private readonly label: Phaser.GameObjects.Text;

  private focused = false;

  private disabled = false;

  private readonly width: number;

  private readonly height: number;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    options: ButtonOptions = {},
  ) {
    this.width = options.width ?? 300;
    this.height = options.height ?? 58;
    this.disabled = options.disabled ?? false;
    this.bg = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, text, {
        fontFamily: FONT_STACK,
        fontSize: '22px',
        color: '#e8e3d5',
      })
      .setOrigin(0.5);
    this.container = scene.add.container(x, y, [this.bg, this.label]).setDepth(DEPTH.OVERLAY);
    this.container.setSize(this.width, this.height);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-this.width / 2, -this.height / 2, this.width, this.height),
      Phaser.Geom.Rectangle.Contains,
    );
    if (!this.disabled && options.onSelect) {
      const cb = options.onSelect;
      this.container.on('pointerup', () => cb());
    }
    this.redraw();
  }

  setText(text: string): void {
    this.label.setText(text);
  }

  setDisabled(disabled: boolean): void {
    this.disabled = disabled;
    this.redraw();
  }

  setFocused(focused: boolean): void {
    if (this.focused === focused) return;
    this.focused = focused;
    this.redraw();
  }

  get isFocused(): boolean {
    return this.focused;
  }

  get x(): number {
    return this.container.x;
  }

  get y(): number {
    return this.container.y;
  }

  select(): void {
    if (!this.disabled) {
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 60,
        yoyo: true,
      });
    }
  }

  destroy(): void {
    this.container.destroy();
  }

  private redraw(): void {
    const w = this.width;
    const h = this.height;
    this.bg.clear();
    this.bg.fillStyle(this.disabled ? 0x1a2033 : this.focused ? 0x2a3a5e : 0x151c30, 0.95);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    this.bg.lineStyle(
      this.focused ? 3 : 1.5,
      this.disabled ? 0x3a4460 : this.focused ? 0xf2a35c : 0x4a5578,
      1,
    );
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    if (this.focused) {
      this.bg.fillStyle(0xf2a35c, 1);
      this.bg.fillTriangle(-w / 2 + 14, -6, -w / 2 + 14, 6, -w / 2 + 24, 0);
    }
    this.label.setColor(this.disabled ? '#5a6580' : this.focused ? '#ffd9a8' : '#e8e3d5');
  }
}
