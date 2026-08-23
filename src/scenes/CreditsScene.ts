import Phaser from 'phaser';
import { GAME_WIDTH, SCENE } from '../core/constants';
import { addBackdrop, getServices, makeTitleText, tr } from './helpers';
import { GameButton } from '../ui/widgets';
import { APP_VERSION, BUILD_ID } from '../version';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super(SCENE.CREDITS);
  }

  create(): void {
    const { audio } = getServices(this);
    addBackdrop(this, 0.97);

    makeTitleText(this, GAME_WIDTH / 2, 80, tr(this, 'credits.title'), 26);
    const mono = 'ui-monospace, Menlo, "Apple SD Gothic Neo", sans-serif';

    this.add
      .text(GAME_WIDTH / 2, 160, tr(this, 'app.title'), {
        fontFamily: mono,
        fontSize: '22px',
        color: '#f2a35c',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 192, tr(this, 'app.slogan'), {
        fontFamily: mono,
        fontSize: '14px',
        color: '#8fa3c7',
      })
      .setOrigin(0.5);

    const sections: Array<[string, string[]]> = [
      [tr(this, 'credits.design'), [tr(this, 'credits.team'), tr(this, 'credits.engine')]],
      [tr(this, 'credits.privacyTitle'), [tr(this, 'credits.privacyBody')]],
      [
        'LICENSE',
        [tr(this, 'credits.license'), tr(this, 'credits.assets'), tr(this, 'credits.ip')],
      ],
    ];

    let y = 260;
    for (const [title, lines] of sections) {
      const titleText = this.add
        .text(GAME_WIDTH / 2, y, title, {
          fontFamily: mono,
          fontSize: '16px',
          color: '#ffd75e',
        })
        .setOrigin(0.5);
      void titleText;
      y += 34;
      for (const line of lines) {
        const body = this.add
          .text(GAME_WIDTH / 2, y, line, {
            fontFamily: mono,
            fontSize: '13px',
            color: '#aab4c8',
            align: 'center',
            wordWrap: { width: 470 },
            lineSpacing: 5,
          })
          .setOrigin(0.5, 0);
        y += body.height + 18;
      }
      y += 12;
    }

    this.add
      .text(GAME_WIDTH / 2, 900, `v${APP_VERSION} · ${BUILD_ID} · Phaser 3 · MIT`, {
        fontFamily: mono,
        fontSize: '11px',
        color: '#4a5578',
      })
      .setOrigin(0.5);

    new GameButton(this, GAME_WIDTH / 2, 940 - 20, tr(this, 'credits.back'), {
      width: 280,
      height: 48,
      onSelect: () => this.scene.start(SCENE.TITLE),
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Escape' || event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        audio.play('uiBack');
        this.scene.start(SCENE.TITLE);
      }
    });
  }
}
