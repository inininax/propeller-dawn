import Phaser from 'phaser';
import { GAME_WIDTH, SCENE } from '../core/constants';
import { DIFFICULTIES } from '../data/difficulty';
import { getShip } from '../data/ships';
import { randomSeed } from '../core/rng';
import { addBackdrop, getServices, makeBodyText, makeTitleText, tr } from './helpers';
import { GameButton, FONT_STACK } from '../ui/widgets';
import { MenuList } from '../ui/hud';
import { applyContinuePenalty, continuePenaltyFactor, formatScore } from '../systems/score';
import type { LocaleKey } from '../systems/locale/en';
import type { BriefingData, ResultData, RunState } from './types';

export class ResultScene extends Phaser.Scene {
  private countdownTimer?: Phaser.GameObjects.Text;

  private countdownValue = 9;

  private menu!: MenuList;

  private buttons: GameButton[] = [];

  private actions: Array<() => void> = [];

  private currentData?: ResultData;

  constructor() {
    super(SCENE.RESULT);
  }

  create(data: ResultData): void {
    this.currentData = data;
    const view = data as ResultData & { expired?: boolean };
    this.countdownValue = 9;
    const { audio, save } = getServices(this);
    addBackdrop(this, 0.9);
    this.actions = [];
    this.buttons = [];

    const diff = DIFFICULTIES[data.run.difficulty];
    const finalScore = applyContinuePenalty(data.run.score, data.run.continuesUsed);
    const previousHi = save.data.hiscores[data.run.difficulty];
    const newRecord = finalScore > previousHi;
    save.submitScore(data.run.difficulty, finalScore);

    audio.stopMusic();
    audio.startMusic('result');

    makeTitleText(
      this,
      GAME_WIDTH / 2,
      170,
      tr(this, data.won ? 'result.missionComplete' : 'result.gameOver'),
      38,
    ).setColor(data.won ? '#ffd75e' : '#e8734a');

    if (newRecord) {
      this.tweens.add({
        targets: makeTitleText(
          this,
          GAME_WIDTH / 2,
          226,
          tr(this, 'result.newRecord'),
          22,
        ).setColor('#7CFC9A'),
        scale: 1.08,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    this.add
      .text(GAME_WIDTH / 2, 290, formatScore(finalScore), {
        fontFamily: FONT_STACK,
        fontSize: '52px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    if (data.run.continuesUsed > 0) {
      makeBodyText(
        this,
        GAME_WIDTH / 2,
        336,
        tr(this, 'result.penaltyNote', {
          n: data.run.continuesUsed,
          m: continuePenaltyFactor(data.run.continuesUsed).toFixed(2),
        }),
        13,
        '#e8734a',
      );
    }

    const stats = [
      `${tr(this, 'result.best')} (${tr(this, diff.nameKey as LocaleKey)}): ${formatScore(
        save.data.hiscores[data.run.difficulty],
      )}`,
      `${tr(this, 'result.graze')}: ${data.grazeCount}`,
      `${tr(this, 'result.maxCombo')}: ${data.maxCombo}`,
      `${tr(this, 'result.stageReached')}: ${Math.min(2, data.run.stageIndex + 1)}/2`,
    ];
    stats.forEach((line, i) => {
      makeBodyText(this, GAME_WIDTH / 2, 360 + i * 30, line, 16, '#8fa3c7');
    });

    if (view.expired) {
      this.addResultActions(data.run);
    } else if (data.won) {
      this.addResultActions(data.run);
    } else if (data.run.continuesUsed < diff.continueLimit) {
      this.addContinueActions(data.run);
    } else {
      this.addResultActions(data.run);
    }

    this.menu = new MenuList(this.buttons, {
      onMove: () => audio.play('uiMove'),
      onSelect: (i) => this.actions[i](),
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'ArrowUp' || event.code === 'KeyW') this.menu.move(-1);
      else if (event.code === 'ArrowDown' || event.code === 'KeyS') this.menu.move(1);
      else if (event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        this.menu.selectCurrent();
      }
    });
  }

  private addAction(label: string, y: number, action: () => void): void {
    const btn = new GameButton(this, GAME_WIDTH / 2, y, label, {
      width: 340,
      onSelect: action,
    });
    this.buttons.push(btn);
    this.actions.push(action);
  }

  private addResultActions(run: RunState): void {
    this.addAction(tr(this, 'common.restart'), 600, () => {
      const { audio } = getServices(this);
      audio.play('uiConfirm');
      const diff = DIFFICULTIES[run.difficulty];
      const ship = getShip(run.shipId);
      this.scene.start(SCENE.BRIEFING, {
        run: {
          ...run,
          lives: diff.playerLives - 1,
          bombs: diff.startBombs + ship.startBombsBonus,
          power: 1,
          hasShield: false,
          score: 0,
          continuesUsed: 0,
          stageIndex: 0,
          seed: randomSeed(),
        },
      } satisfies BriefingData);
    });
    this.addAction(tr(this, 'result.returnTitle'), 686, () => {
      this.scene.start(SCENE.TITLE);
    });
  }

  private addContinueActions(run: RunState): void {
    const diff = DIFFICULTIES[run.difficulty];
    const left = diff.continueLimit - run.continuesUsed;
    makeBodyText(this, GAME_WIDTH / 2, 520, tr(this, 'result.continueOffer'), 20, '#ffd75e');

    this.addAction(tr(this, 'result.useContinue', { n: left }), 586, () => this.doContinue(run));
    this.countdownTimer = makeBodyText(this, GAME_WIDTH / 2, 540, '', 15, '#8fa3c7');
    const timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: this.countdownValue,
      callback: () => {
        this.countdownValue -= 1;
        if (this.countdownValue <= 0) {
          timerEvent.remove();
          this.giveUp(run);
          return;
        }
        this.updateCountdownLabel(left);
        getServices(this).audio.play('uiMove');
      },
    });
    this.updateCountdownLabel(left);

    this.addAction(tr(this, 'result.giveUp'), 686, () => {
      timerEvent.remove();
      this.giveUp(run);
    });
  }

  private updateCountdownLabel(left: number): void {
    this.countdownTimer?.setText(
      `${tr(this, 'result.continueLeft', { n: left })}\n${tr(this, 'result.autoEnd', {
        s: this.countdownValue,
      })}`,
    );
  }

  private doContinue(run: RunState): void {
    const { audio } = getServices(this);
    audio.play('extend');
    const diff = DIFFICULTIES[run.difficulty];
    const ship = getShip(run.shipId);
    const continued: RunState = {
      ...run,
      continuesUsed: run.continuesUsed + 1,
      lives: diff.playerLives - 1,
      bombs: diff.startBombs + ship.startBombsBonus,
      power: Math.max(1, run.power - 1),
      hasShield: false,
    };
    this.scene.start(SCENE.GAME, { run: continued });
  }

  private giveUp(_run: RunState): void {
    if (this.currentData) {
      this.scene.restart({ ...this.currentData, expired: true });
    }
  }
}
