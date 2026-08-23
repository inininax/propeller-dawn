import Phaser from 'phaser';
import { GAME_WIDTH, SCENE } from '../core/constants';
import { addBackdrop, getServices, makeTitleText, tr } from './helpers';
import { GameButton } from '../ui/widgets';
import { MenuList } from '../ui/hud';
import type { LocaleKey } from '../systems/locale/en';

interface PauseData {
  from: string;
}

export class PauseOverlayScene extends Phaser.Scene {
  private menu!: MenuList;

  private buttons: GameButton[] = [];

  constructor() {
    super(SCENE.PAUSE);
  }

  create(_data: PauseData): void {
    this.buttons = [];
    const { audio } = getServices(this);
    addBackdrop(this, 0.66);
    makeTitleText(this, GAME_WIDTH / 2, 340, tr(this, 'pause.title'), 40);

    const actions: Array<{ label: LocaleKey; run: () => void }> = [
      {
        label: 'common.resume',
        run: () => this.resumeGame(),
      },
      {
        label: 'pause.settings',
        run: () => {
          this.registry.set('settingsReturn', SCENE.PAUSE);
          this.scene.launch(SCENE.SETTINGS);
          this.scene.bringToTop(SCENE.SETTINGS);
          this.scene.pause();
        },
      },
      {
        label: 'common.quit',
        run: () => {
          audio.play('uiBack');
          this.scene.stop(SCENE.GAME);
          this.scene.stop();
          this.scene.start(SCENE.TITLE);
        },
      },
    ];

    actions.forEach((action, i) => {
      this.buttons.push(
        new GameButton(this, GAME_WIDTH / 2, 470 + i * 78, tr(this, action.label), {
          width: 320,
          onSelect: action.run,
        }),
      );
    });
    this.menu = new MenuList(this.buttons, {
      onMove: () => audio.play('uiMove'),
      onSelect: (i) => actions[i].run(),
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Escape' || event.code === 'KeyP') {
        this.resumeGame();
        return;
      }
      if (event.code === 'ArrowUp' || event.code === 'KeyW') this.menu.move(-1);
      else if (event.code === 'ArrowDown' || event.code === 'KeyS') this.menu.move(1);
      else if (event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        this.menu.selectCurrent();
      }
    });
  }

  private resumeGame(): void {
    const { audio } = getServices(this);
    audio.play('uiConfirm');
    audio.resume();
    this.scene.stop();
    this.scene.resume(SCENE.GAME);
  }
}
