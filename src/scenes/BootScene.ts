import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE, STORAGE_KEY } from '../core/constants';
import { AudioEngine } from '../systems/audio/engine';
import { I18n } from '../systems/locale/i18n';
import { SaveService, createBrowserStorage } from '../systems/save';
import { TEXTURE_GEN_STEPS, generateBossTextures } from '../art/textures';
import { FONT_STACK } from '../ui/widgets';
import { APP_VERSION } from '../version';
import { DIFFICULTIES } from '../data/difficulty';
import { getShip } from '../data/ships';

export class BootScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;

  private progressRect!: Phaser.GameObjects.Rectangle;

  constructor() {
    super(SCENE.BOOT);
  }

  create(): void {
    const services = this.initServices();

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, 'PROPELLER DAWN', {
        fontFamily: FONT_STACK,
        fontSize: '34px',
        color: '#f2a35c',
      })
      .setOrigin(0.5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.5 + 30, 380, 10, 0x1a2238).setDepth(1);
    this.progressRect = this.add
      .rectangle(GAME_WIDTH / 2 - 188, GAME_HEIGHT * 0.5 + 30, 2, 6, 0xf2a35c)
      .setOrigin(0, 0.5)
      .setDepth(2);
    this.progressBar = this.add.graphics();
    this.progressBar.setDepth(2);

    const steps: Array<() => void> = [
      ...TEXTURE_GEN_STEPS.map((fn) => () => fn(this)),
      () => generateBossTextures(this),
      () => warmParticles(this),
    ];
    let i = 0;
    const timer = this.time.addEvent({
      delay: 60,
      repeat: steps.length,
      callback: () => {
        if (i < steps.length) {
          try {
            steps[i]();
          } catch (err) {
            timer.remove();
            reportBootError(err);
            return;
          }
          i += 1;
          this.progressRect.width = Math.max(2, (i / steps.length) * 376);
        } else {
          timer.remove();
          this.scene.start(SCENE.TITLE, { saveNotice: services.saveNotice });
        }
      },
    });
  }

  private initServices(): { saveNotice: boolean } {
    if (!this.registry.has('save')) {
      const load = (() => {
        try {
          const storage = createBrowserStorage();
          storage.getItem(STORAGE_KEY);
          return new SaveService(storage);
        } catch {
          const memory = {
            getItem: (_k: string) => null,
            setItem: (_k: string, _v: string) => undefined,
            removeItem: (_k: string) => undefined,
          };
          return new SaveService(memory);
        }
      })();
      const audio = new AudioEngine();
      audio.setMuted(load.data.settings.muted);
      audio.setMusicVolume(load.data.settings.musicVolume);
      audio.setSfxVolume(load.data.settings.sfxVolume);
      const i18n = new I18n(load.data.settings.language);
      this.registry.set('save', load);
      this.registry.set('audio', audio);
      this.registry.set('i18n', i18n);
      window.addEventListener('pointerdown', () => audio.unlock(), { once: false });
      window.addEventListener('keydown', () => audio.unlock(), { once: false });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          audio.suspend();
        } else if (!audio.isUserSuspended) {
          audio.resume();
        }
      });
    }
    const save = this.registry.get('save') as SaveService;
    const notice =
      (this.game.registry.get('pendingSaveNotice') as string | undefined) === 'corrupt' ||
      save.data.version !== 1;
    if (import.meta.env.MODE === 'e2e') {
      (window as unknown as Record<string, unknown>).__PD_SAVE__ = {
        markTutorialDone: () => save.markTutorialDone(),
        resetAll: () => save.resetAll(),
        data: () => save.data,
        startGame: (patch?: Record<string, unknown>) => {
          const diffId = (patch?.difficulty as string) ?? 'easy';
          const diff = DIFFICULTIES[(diffId as keyof typeof DIFFICULTIES) ?? 'easy'];
          const ship = getShip((patch?.shipId as string) ?? 'lark');
          this.scene.stop(SCENE.TITLE);
          this.scene.stop(SCENE.TUTORIAL);
          this.scene.start(SCENE.BRIEFING, {
            run: {
              shipId: ship.id,
              difficulty: diff.id,
              stageIndex: (patch?.stageIndex as number | undefined) ?? 0,
              lives: diff.playerLives - 1,
              bombs: diff.startBombs + ship.startBombsBonus,
              power: 1,
              hasShield: false,
              score: 0,
              continuesUsed: 0,
              seed: 123456789,
            },
          });
        },
        sceneKey: (): string => {
          const scenes = this.game.scene.scenes;
          for (let i = scenes.length - 1; i >= 0; i--) {
            if (scenes[i].scene.isActive() && scenes[i].scene.settings.key !== SCENE.BOOT) {
              return scenes[i].scene.settings.key;
            }
          }
          return 'unknown';
        },
      };
    }
    return { saveNotice: notice };
  }
}

function warmParticles(scene: Phaser.Scene): void {
  scene.add.particles(0, 0, 'p_spark', { emitting: false }).destroy();
}

export function reportBootError(err: unknown): void {
  window.console.error(err);
  const overlay = document.getElementById('boot-error');
  const detail = document.getElementById('boot-error-detail');
  if (overlay && detail) {
    detail.textContent = err instanceof Error ? `${err.message}\n${APP_VERSION}` : String(err);
    overlay.style.display = 'flex';
  }
}
