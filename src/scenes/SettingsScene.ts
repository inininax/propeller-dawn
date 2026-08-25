import Phaser from 'phaser';
import { GAME_WIDTH, SCENE } from '../core/constants';
import { addBackdrop, getServices, makeTitleText, tr } from './helpers';
import { GameButton } from '../ui/widgets';
import { MenuList } from '../ui/hud';
import { APP_VERSION, BUILD_ID } from '../version';

interface SettingsData {
  returnTo?: string;
}

interface Row {
  label(): string;
  value(): string;
  adjust(dir: 1 | -1): void;
}

export class SettingsScene extends Phaser.Scene {
  private rows: Row[] = [];

  private rowButtons: GameButton[] = [];

  private valueTexts: Phaser.GameObjects.Text[] = [];

  private rowIndex = 0;

  private confirmErase = false;

  private toast: Phaser.GameObjects.Text | null = null;

  constructor() {
    super(SCENE.SETTINGS);
  }

  create(_data: SettingsData): void {
    const { audio, i18n, save } = getServices(this);
    this.rows = [];
    this.rowButtons = [];
    this.valueTexts = [];
    this.confirmErase = false;
    this.rowIndex = 0;
    addBackdrop(this, 0.94);
    makeTitleText(this, GAME_WIDTH / 2, 90, tr(this, 'settings.title'), 30);

    const cycleLanguage = (dir: 1 | -1): 'auto' | 'ko' | 'en' => {
      const order: Array<'auto' | 'ko' | 'en'> = ['auto', 'ko', 'en'];
      const cur = order.indexOf(save.data.settings.language);
      const next = order[(cur + dir + order.length) % order.length];
      save.updateSettings({ language: next });
      i18n.setPreference(next);
      audio.play('uiMove');
      this.scene.restart();
      return next;
    };

    const setVolumeStep = (key: 'musicVolume' | 'sfxVolume', dir: 1 | -1): number => {
      const cur = Math.round(save.data.settings[key] * 10);
      const next = Math.min(10, Math.max(0, cur + dir));
      save.updateSettings({ [key]: next / 10 });
      audio.setMusicVolume(save.data.settings.musicVolume);
      audio.setSfxVolume(save.data.settings.sfxVolume);
      audio.unlock();
      audio.play('uiConfirm');
      this.updateRowValues();
      return next;
    };

    const toggle = (key: 'muted' | 'screenShake' | 'reduceFlash'): boolean => {
      const next = !save.data.settings[key];
      save.updateSettings({ [key]: next });
      if (key === 'muted') audio.setMuted(next);
      audio.play('uiMove');
      this.updateRowValues();
      return next;
    };

    this.rows = [
      {
        label: () => tr(this, 'settings.language'),
        value: () =>
          save.data.settings.language === 'auto'
            ? `${tr(this, 'common.auto')} (${i18n.language.toUpperCase()})`
            : save.data.settings.language === 'ko'
              ? tr(this, 'settings.korean')
              : tr(this, 'settings.english'),
        adjust: (dir) => void cycleLanguage(dir),
      },
      {
        label: () => tr(this, 'settings.music'),
        value: () => bars(save.data.settings.musicVolume),
        adjust: (dir) => void setVolumeStep('musicVolume', dir),
      },
      {
        label: () => tr(this, 'settings.sfx'),
        value: () => bars(save.data.settings.sfxVolume),
        adjust: (dir) => void setVolumeStep('sfxVolume', dir),
      },
      {
        label: () => tr(this, 'settings.mute'),
        value: () => onOff(tr, this, save.data.settings.muted),
        adjust: () => void toggle('muted'),
      },
      {
        label: () => tr(this, 'settings.shake'),
        value: () => onOff(tr, this, save.data.settings.screenShake),
        adjust: () => void toggle('screenShake'),
      },
      {
        label: () => tr(this, 'settings.flash'),
        value: () => onOff(tr, this, save.data.settings.reduceFlash),
        adjust: () => void toggle('reduceFlash'),
      },
      {
        label: () => tr(this, 'settings.tutorial'),
        value: () => '',
        adjust: () => {
          this.scene.stop(SCENE.GAME);
          this.scene.stop(SCENE.PAUSE);
          this.registry.remove('settingsReturn');
          this.scene.start(SCENE.TUTORIAL, { then: SCENE.TITLE });
        },
      },
      {
        label: () => tr(this, 'settings.diagnostics'),
        value: () => '',
        adjust: () => {
          void this.copyDiagnostics();
        },
      },
      {
        label: () =>
          this.confirmErase ? tr(this, 'settings.erase') : tr(this, 'settings.resetData'),
        value: () => '',
        adjust: () => {
          if (!this.confirmErase) {
            this.confirmErase = true;
            this.showToast(
              `${tr(this, 'settings.resetConfirmTitle')}\n${tr(this, 'settings.resetConfirmDesc')}`,
            );
            this.rowButtons[8].setText(`${tr(this, 'settings.erase')} ⚠`);
            return;
          }
          save.resetAll();
          audio.setMuted(save.data.settings.muted);
          audio.setMusicVolume(save.data.settings.musicVolume);
          audio.setSfxVolume(save.data.settings.sfxVolume);
          i18n.setPreference(save.data.settings.language);
          this.confirmErase = false;
          this.rowButtons[8].setText(tr(this, 'settings.resetData'));
          this.showToast(tr(this, 'settings.erased'));
          this.updateRowValues();
        },
      },
    ];

    this.rows.forEach((row, i) => {
      const y = 170 + i * 62;
      const labelBtn = new GameButton(this, GAME_WIDTH / 2 - 90, y, '', {
        width: 300,
        height: 50,
        onSelect: () => row.adjust(1),
      });
      labelBtn.setText('');
      this.add.text(GAME_WIDTH / 2 - 128, y, '', { fontFamily: 'sans-serif' }).destroy();
      const labelText = this.add
        .text(-132, 0, row.label(), {
          fontFamily: 'ui-monospace, Menlo, "Apple SD Gothic Neo", sans-serif',
          fontSize: '16px',
          color: '#cfd6e4',
        })
        .setOrigin(0, 0.5);
      labelText.setName(`rowLabel${i}`);
      const value = this.add
        .text(120, 0, row.value(), {
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: '16px',
          color: '#f2a35c',
        })
        .setOrigin(1, 0.5);
      value.setName(`rowValue${i}`);
      labelBtn.container.add([labelText, value]);
      this.valueTexts[i] = value;
      this.rowButtons[i] = labelBtn;
    });

    new MenuList(this.rowButtons, {
      onMove: () => audio.play('uiMove'),
      onSelect: (i) => this.rows[i].adjust(1),
    });

    this.add
      .text(
        GAME_WIDTH / 2,
        905,
        `${tr(this, 'settings.versionLabel')} ${APP_VERSION} · ${BUILD_ID}`,
        {
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: '12px',
          color: '#4a5578',
        },
      )
      .setOrigin(0.5);
    if (!navigator.cookieEnabled || isStorageBlocked()) {
      makeWarn(this, tr(this, 'settings.saveUnavailable'));
    }

    new GameButton(this, GAME_WIDTH / 2, 812, tr(this, 'common.back'), {
      width: 240,
      height: 52,
      onSelect: () => this.goBack(),
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveRow(-1);
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveRow(1);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.rows[this.rowIndex].adjust(-1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.rows[this.rowIndex].adjust(1);
          break;
        case 'Enter':
        case 'Space':
          event.preventDefault();
          this.rows[this.rowIndex].adjust(1);
          break;
        case 'Escape':
          this.goBack();
          break;
        default:
          break;
      }
    });
  }

  private moveRow(delta: number): void {
    this.rowIndex = (this.rowIndex + delta + this.rows.length) % this.rows.length;
    getServices(this).audio.play('uiMove');
    this.rowButtons.forEach((b, i) => b.setFocused(i === this.rowIndex));
  }

  private updateRowValues(): void {
    this.rows.forEach((row, i) => {
      this.valueTexts[i]?.setText(row.value());
      const labelChild = this.rowButtons[i].container.list.find(
        (c): c is Phaser.GameObjects.Text => c.name === `rowLabel${i}`,
      );
      if (labelChild) labelChild.setText(row.label());
    });
  }

  private goBack(): void {
    const returnTo = (this.registry.get('settingsReturn') as string | undefined) ?? SCENE.TITLE;
    this.registry.remove('settingsReturn');
    getServices(this).audio.play('uiBack');
    if (returnTo === SCENE.PAUSE && this.scene.isPaused(SCENE.PAUSE)) {
      this.scene.stop();
      this.scene.resume(SCENE.PAUSE);
    } else {
      this.scene.stop();
      if (!this.scene.isActive(returnTo)) {
        this.scene.start(returnTo === SCENE.GAME ? SCENE.TITLE : returnTo);
      }
    }
  }

  private async copyDiagnostics(): Promise<void> {
    const payload = {
      app: 'propeller-dawn',
      version: APP_VERSION,
      buildId: BUILD_ID,
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      scene: SCENE.SETTINGS,
      seed: null,
      timestamp: new Date().toISOString(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      this.showToast(tr(this, 'settings.diagCopied'));
    } catch {
      this.showToast('Clipboard unavailable');
    }
  }

  private showToast(message: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(GAME_WIDTH / 2, 850, message, {
        fontFamily: 'ui-monospace, Menlo, "Apple SD Gothic Neo", sans-serif',
        fontSize: '14px',
        color: '#ffd75e',
        align: 'center',
        wordWrap: { width: 460 },
      })
      .setOrigin(0.5);
    this.time.delayedCall(2600, () => {
      this.toast?.destroy();
      this.toast = null;
    });
  }
}

function onOff(trFn: typeof tr, scene: Phaser.Scene, value: boolean): string {
  return value ? trFn(scene, 'common.on') : trFn(scene, 'common.off');
}

function bars(v: number): string {
  const filled = Math.round(v * 10);
  return '■'.repeat(filled) + '□'.repeat(10 - filled);
}

function isStorageBlocked(): boolean {
  try {
    const k = '__pd_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return false;
  } catch {
    return true;
  }
}

function makeWarn(scene: Phaser.Scene, text: string): void {
  scene.add
    .text(GAME_WIDTH / 2, 932, text, {
      fontFamily: 'ui-monospace, Menlo, "Apple SD Gothic Neo", sans-serif',
      fontSize: '12px',
      color: '#e8734a',
      align: 'center',
      wordWrap: { width: 480 },
    })
    .setOrigin(0.5);
}
