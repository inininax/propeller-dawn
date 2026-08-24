import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './core/constants';
import { BootScene, reportBootError } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { TutorialScene } from './scenes/TutorialScene';
import { ShipSelectScene } from './scenes/ShipSelectScene';
import { BriefingScene } from './scenes/BriefingScene';
import { GameScene } from './scenes/GameScene';
import { PauseOverlayScene } from './scenes/PauseOverlayScene';
import { StageClearOverlayScene } from './scenes/StageClearOverlayScene';
import { ResultScene } from './scenes/ResultScene';
import { SettingsScene } from './scenes/SettingsScene';
import { CreditsScene } from './scenes/CreditsScene';

declare const __PD_DEBUG_HOOKS__: boolean;

window.addEventListener('error', (event) => {
  if (!window.__PD_GAME_READY__) {
    reportBootError(event.error ?? event.message);
  }
});
window.addEventListener('unhandledrejection', (event) => {
  if (!window.__PD_GAME_READY__) {
    reportBootError(event.reason);
  }
});

try {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-root',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#05070f',
    roundPixels: true,
    disableContextMenu: true,
    banner: false,
    fps: {
      target: 60,
      min: 30,
      ...(__PD_DEBUG_HOOKS__ ? { forceSetTimeOut: true, smoothStep: false } : {}),
    },
    input: { gamepad: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [
      BootScene,
      TitleScene,
      TutorialScene,
      ShipSelectScene,
      BriefingScene,
      GameScene,
      PauseOverlayScene,
      StageClearOverlayScene,
      ResultScene,
      SettingsScene,
      CreditsScene,
    ],
  });

  if (__PD_DEBUG_HOOKS__) {
    (window as unknown as Record<string, unknown>).__PD_GAME__ = game;
  }
  game.events.once(Phaser.Core.Events.READY, () => {
    window.__PD_GAME_READY__ = true;
  });
} catch (err) {
  reportBootError(err);
}

if (import.meta.env.PROD && !__PD_DEBUG_HOOKS__ && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => undefined);
  });
}

declare global {
  interface Window {
    __PD_GAME_READY__?: boolean;
  }
}
