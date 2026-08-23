import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE } from '../core/constants';
import type { LocaleKey } from '../systems/locale/en';
import { makeBodyText, tr, addBackdrop, getServices } from './helpers';
import { GameButton, FONT_STACK } from '../ui/widgets';
import { MenuList } from '../ui/hud';
import { formatScore } from '../systems/score';
import { APP_VERSION, BUILD_ID } from '../version';

interface TitleData {
  saveNotice?: boolean;
}

export class TitleScene extends Phaser.Scene {
  private menu!: MenuList;

  private buttons: GameButton[] = [];

  constructor() {
    super(SCENE.TITLE);
  }

  create(data: TitleData): void {
    this.buttons = [];
    const { audio, save } = getServices(this);
    addBackdrop(this, 1);

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b1026)
      .setDepth(-60);

    const sun = this.add.circle(430, 700, 150, 0xf2a35c, 0.35).setDepth(-55);
    this.tweens.add({ targets: sun, alpha: 0.22, duration: 2400, yoyo: true, repeat: -1 });

    const ship = this.add
      .image(GAME_WIDTH / 2, 300, 'ship_lark')
      .setScale(1.7)
      .setDepth(-50);
    this.tweens.add({
      targets: ship,
      y: 288,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.add
      .text(GAME_WIDTH / 2, 420, 'PROPELLER DAWN', {
        fontFamily: FONT_STACK,
        fontSize: '52px',
        color: '#f2a35c',
        stroke: '#000000cc',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    makeBodyText(
      this,
      GAME_WIDTH / 2,
      470,
      `${tr(this, 'hud.hi')} ${formatScore(save.data.hiscores.normal)}`,
      16,
      '#8fa3c7',
    );

    const startY = 580;
    const labels: Array<{ key: LocaleKey; action: () => void }> = [
      {
        key: 'menu.start',
        action: () => {
          audio.play('uiConfirm');
          if (!save.data.tutorialDone) {
            this.scene.start(SCENE.TUTORIAL, { then: SCENE.SHIP_SELECT });
          } else {
            this.scene.start(SCENE.SHIP_SELECT);
          }
        },
      },
      {
        key: 'menu.tutorial',
        action: () => this.scene.start(SCENE.TUTORIAL, { then: SCENE.TITLE }),
      },
      { key: 'menu.settings', action: () => this.scene.start(SCENE.SETTINGS) },
      { key: 'menu.credits', action: () => this.scene.start(SCENE.CREDITS) },
    ];
    labels.forEach((entry, i) => {
      this.buttons.push(
        new GameButton(this, GAME_WIDTH / 2, startY + i * 74, tr(this, entry.key), {
          width: 320,
          onSelect: entry.action,
        }),
      );
    });
    this.menu = new MenuList(this.buttons, {
      onMove: () => audio.play('uiMove'),
      onSelect: (index) => labels[index].action(),
    });

    if (data.saveNotice) {
      makeBodyText(this, GAME_WIDTH / 2, 905, tr(this, 'settings.recoveredNotice'), 14, '#e8734a');
    }
    this.add
      .text(GAME_WIDTH / 2, 936, `v${APP_VERSION} · ${BUILD_ID}`, {
        fontFamily: FONT_STACK,
        fontSize: '12px',
        color: '#4a5578',
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'ArrowUp' || event.code === 'KeyW') this.menu.move(-1);
      else if (event.code === 'ArrowDown' || event.code === 'KeyS') this.menu.move(1);
      else if (event.code === 'Enter' || event.code === 'Space' || event.code === 'NumpadEnter') {
        event.preventDefault();
        this.menu.selectCurrent();
      }
    });
    this.events.once('shutdown', () => this.input.keyboard?.removeAllListeners());

    audio.unlock();
    audio.startMusic('title');
  }
}
