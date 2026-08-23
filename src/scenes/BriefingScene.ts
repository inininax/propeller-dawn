import Phaser from 'phaser';
import { GAME_WIDTH, SCENE } from '../core/constants';
import { STAGES } from '../data/stages';
import { addBackdrop, getServices, tr } from './helpers';
import { GameButton, FONT_STACK } from '../ui/widgets';
import type { LocaleKey } from '../systems/locale/en';
import type { BriefingData, RunState } from './types';

export class BriefingScene extends Phaser.Scene {
  private run!: RunState;

  private typedText?: Phaser.GameObjects.Text;

  private typeIndex = 0;

  constructor() {
    super(SCENE.BRIEFING);
  }

  create(data: BriefingData): void {
    const { audio } = getServices(this);
    this.run = data.run;
    addBackdrop(this, 1);
    const stage = STAGES[this.run.stageIndex];

    this.add
      .text(GAME_WIDTH / 2, 300, tr(this, stage.nameKey as LocaleKey), {
        fontFamily: FONT_STACK,
        fontSize: '34px',
        color: '#f2a35c',
        stroke: '#000000aa',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.typedText = this.add
      .text(GAME_WIDTH / 2, 400, '', {
        fontFamily: FONT_STACK,
        fontSize: '19px',
        color: '#cfd6e4',
        align: 'center',
        wordWrap: { width: 460 },
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    const fullText = tr(this, stage.subKey as LocaleKey);
    this.typeIndex = 0;
    const typeTimer = this.time.addEvent({
      delay: 42,
      repeat: fullText.length,
      callback: () => {
        this.typeIndex += 1;
        this.typedText?.setText(fullText.slice(0, Math.min(this.typeIndex, fullText.length)));
        if (this.typeIndex >= fullText.length) typeTimer.remove();
      },
    });

    new GameButton(this, GAME_WIDTH / 2, 640, `${tr(this, 'select.start')} ▶`, {
      width: 320,
      height: 64,
      onSelect: () => this.launchGame(),
    });

    const touch = window.matchMedia('(pointer: coarse)').matches;
    this.add
      .text(GAME_WIDTH / 2, 880, tr(this, touch ? 'common.touchHint' : 'common.keyboardHint'), {
        fontFamily: FONT_STACK,
        fontSize: '14px',
        color: '#8fa3c7',
        align: 'center',
        wordWrap: { width: 480 },
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Enter' || event.code === 'Space' || event.code === 'NumpadEnter') {
        event.preventDefault();
        this.launchGame();
      }
    });
    audio.startMusic(stage.theme === 'dawn' ? 'dawn' : 'ember');
  }

  private launchGame(): void {
    getServices(this).audio.play('uiConfirm');
    this.scene.start(SCENE.GAME, { run: this.run });
  }
}
