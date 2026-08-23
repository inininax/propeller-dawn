import Phaser from 'phaser';
import { GAME_WIDTH, SCENE } from '../core/constants';
import { addBackdrop, getServices, makeTitleText, tr } from './helpers';
import { GameButton } from '../ui/widgets';
import { MenuList } from '../ui/hud';
import type { LocaleKey } from '../systems/locale/en';

interface TutorialData {
  then?: string;
}

interface TutorialPage {
  titleKey: LocaleKey;
  lines: LocaleKey[];
}

export class TutorialScene extends Phaser.Scene {
  private pages: TutorialPage[] = [];

  private thenTarget: string = SCENE.TITLE;

  private pageIndex = 0;

  private contentLayer!: Phaser.GameObjects.Container;

  private prevBtn!: GameButton;

  private nextBtn!: GameButton;

  private menu!: MenuList;

  constructor() {
    super(SCENE.TUTORIAL);
  }

  create(data: TutorialData): void {
    const { audio, i18n, save } = getServices(this);
    this.pageIndex = 0;
    this.thenTarget = data.then ?? SCENE.TITLE;
    addBackdrop(this, 1);
    const touch =
      window.matchMedia('(pointer: coarse)').matches || this.sys.game.device.input.touch;

    this.pages = [
      {
        titleKey: 'tutorial.title',
        lines: ['tutorial.goal', touch ? 'common.touchHint' : 'common.keyboardHint'],
      },
      {
        titleKey: 'tutorial.move',
        lines: [touch ? 'tutorial.moveTouch' : 'tutorial.moveDesktop'],
      },
      {
        titleKey: 'tutorial.fire',
        lines: [touch ? 'tutorial.fireTouch' : 'tutorial.fireDesktop', 'tutorial.focusDesc'],
      },
      { titleKey: 'tutorial.bomb', lines: ['tutorial.bombDesc'] },
      { titleKey: 'tutorial.items', lines: ['tutorial.itemsDesc', 'tutorial.grazeDesc'] },
    ];

    makeTitleText(this, GAME_WIDTH / 2, 150, i18n.t('tutorial.title'));
    this.contentLayer = this.add.container(0, 0);

    this.prevBtn = new GameButton(this, GAME_WIDTH / 2 - 110, 760, tr(this, 'tutorial.prev'), {
      width: 180,
      onSelect: () => this.turn(-1),
    });
    this.nextBtn = new GameButton(this, GAME_WIDTH / 2 + 110, 760, tr(this, 'tutorial.next'), {
      width: 180,
      onSelect: () => this.turn(1),
    });
    this.menu = new MenuList([this.prevBtn, this.nextBtn], {
      onMove: () => audio.play('uiMove'),
      onSelect: (i) => this.turn(i === 0 ? -1 : 1),
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') this.turn(-1);
      else if (event.code === 'ArrowRight' || event.code === 'KeyD') this.turn(1);
      else if (event.code === 'Escape') this.finish(this.thenTarget, false);
    });

    this.renderPage();
    void save;
  }

  private renderPage(): void {
    this.contentLayer.removeAll(true);
    const page = this.pages[this.pageIndex];
    if (!page) return;
    const title = this.add
      .text(GAME_WIDTH / 2, 300, tr(this, page.titleKey), {
        fontFamily: 'ui-monospace, Menlo, "Apple SD Gothic Neo", sans-serif',
        fontSize: '30px',
        color: '#f2a35c',
      })
      .setOrigin(0.5);
    this.contentLayer.add(title);
    page.lines.forEach((key, i) => {
      const body = this.add
        .text(GAME_WIDTH / 2, 400 + i * 90, tr(this, key), {
          fontFamily: 'ui-monospace, Menlo, "Apple SD Gothic Neo", sans-serif',
          fontSize: '19px',
          color: '#cfd6e4',
          align: 'center',
          wordWrap: { width: 440 },
          lineSpacing: 6,
        })
        .setOrigin(0.5, 0);
      this.contentLayer.add(body);
    });
    const indicator = this.add
      .text(GAME_WIDTH / 2, 700, `${this.pageIndex + 1} / ${this.pages.length}`, {
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: '16px',
        color: '#8fa3c7',
      })
      .setOrigin(0.5);
    this.contentLayer.add(indicator);
    this.prevBtn.setDisabled(this.pageIndex === 0);
    const last = this.pageIndex === this.pages.length - 1;
    this.nextBtn.setText(last ? tr(this, 'tutorial.done') : tr(this, 'tutorial.next'));
  }

  private turn(delta: number): void {
    const { audio, save } = getServices(this);
    const nextIndex = this.pageIndex + delta;
    if (delta > 0 && nextIndex >= this.pages.length) {
      audio.play('uiConfirm');
      save.markTutorialDone();
      this.scene.start(this.thenTarget);
      return;
    }
    this.pageIndex = Phaser.Math.Clamp(nextIndex, 0, this.pages.length - 1);
    audio.play('uiMove');
    this.menu.setIndex(delta > 0 ? 1 : 0);
    this.renderPage();
  }

  private finish(target: string, markDone: boolean): void {
    const { save } = getServices(this);
    if (markDone) save.markTutorialDone();
    this.scene.start(target);
  }
}
