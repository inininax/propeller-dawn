import Phaser from 'phaser';
import { GAME_WIDTH, SCENE } from '../core/constants';
import { addBackdrop, getServices, makeTitleText, tr } from './helpers';
import { GameButton, FONT_STACK } from '../ui/widgets';
import type { LocaleKey } from '../systems/locale/en';
import type { RunState, StageClearResult } from './types';

interface StageClearData {
  result: StageClearResult;
  run: RunState;
}

export class StageClearOverlayScene extends Phaser.Scene {
  constructor() {
    super(SCENE.STAGE_CLEAR);
  }

  create(data: StageClearData): void {
    const { audio, save, i18n } = getServices(this);
    addBackdrop(this, 0.78);
    save.recordStageClear(Math.max(save.data.stagesCleared, data.run.stageIndex));

    makeTitleText(this, GAME_WIDTH / 2, 300, tr(this, 'clear.title'), 40);

    const rows: Array<[LocaleKey, number]> = [
      ['clear.livesBonus', data.result.livesBonus],
      ['clear.bombsBonus', data.result.bombsBonus],
      ['clear.sectionBonus', data.result.flightBonus],
    ];
    const texts: Phaser.GameObjects.Text[] = [];
    rows.forEach(([key, value], i) => {
      const t = this.add
        .text(GAME_WIDTH / 2, 400 + i * 46, `${tr(this, key)}  +${value.toLocaleString('en-US')}`, {
          fontFamily: FONT_STACK,
          fontSize: '21px',
          color: '#cfd6e4',
        })
        .setOrigin(0.5)
        .setAlpha(0);
      texts.push(t);
    });
    const total = this.add
      .text(
        GAME_WIDTH / 2,
        570,
        `${tr(this, 'result.finalScore')}  ${data.run.score.toLocaleString('en-US')}`,
        { fontFamily: FONT_STACK, fontSize: '26px', color: '#ffd75e' },
      )
      .setOrigin(0.5)
      .setAlpha(0);

    texts.forEach((t, i) => {
      this.tweens.add({
        targets: t,
        alpha: 1,
        delay: 350 * (i + 1),
        duration: 260,
        onStart: () => audio.play('pickupMedal'),
      });
    });
    this.tweens.add({
      targets: total,
      alpha: 1,
      delay: 1500,
      duration: 300,
      onComplete: () => audio.play('extend'),
    });

    void i18n;
    const btn = new GameButton(this, GAME_WIDTH / 2, 700, tr(this, 'clear.next'), {
      width: 320,
      onSelect: () => {
        audio.play('uiConfirm');
        audio.resume();
        this.scene.stop(SCENE.GAME);
        this.scene.stop();
        this.scene.start(SCENE.BRIEFING, { run: data.run });
      },
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (
        event.code === 'Enter' ||
        event.code === 'Space' ||
        event.code === 'NumpadEnter' ||
        event.code === 'Escape'
      ) {
        event.preventDefault();
        btn.select();
        audio.play('uiConfirm');
        audio.resume();
        this.scene.stop(SCENE.GAME);
        this.scene.stop();
        this.scene.start(SCENE.BRIEFING, { run: data.run });
      }
    });
  }
}
