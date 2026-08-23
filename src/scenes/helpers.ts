import type Phaser from 'phaser';
import type { AudioEngine } from '../systems/audio/engine';
import type { I18n } from '../systems/locale/i18n';
import type { SaveService } from '../systems/save';
import type { LocaleKey } from '../systems/locale/en';
import { FONT_STACK } from '../ui/widgets';

export interface Services {
  audio: AudioEngine;
  i18n: I18n;
  save: SaveService;
}

export function getServices(scene: Phaser.Scene): Services {
  return {
    audio: scene.registry.get('audio') as AudioEngine,
    i18n: scene.registry.get('i18n') as I18n,
    save: scene.registry.get('save') as SaveService,
  };
}

export function tr(
  scene: Phaser.Scene,
  key: LocaleKey,
  params?: Record<string, string | number>,
): string {
  return getServices(scene).i18n.t(key, params);
}

export function addBackdrop(scene: Phaser.Scene, alpha = 0.72): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(270, 480, 540, 960, 0x05070f, alpha).setDepth(-50);
}

export function makeTitleText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 34,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT_STACK,
      fontSize: `${size}px`,
      color: '#ffd75e',
      stroke: '#000000aa',
      strokeThickness: 5,
    })
    .setOrigin(0.5);
}

export function makeBodyText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 17,
  color = '#cfd6e4',
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT_STACK,
    fontSize: `${size}px`,
    color,
    align: 'center',
    wordWrap: { width: 470 },
    lineSpacing: 6,
  });
}
