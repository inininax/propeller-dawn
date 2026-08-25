import Phaser from 'phaser';
import { GAME_WIDTH, SCENE } from '../core/constants';
import { randomSeed } from '../core/rng';
import type { RunState } from './types';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../data/difficulty';
import { SHIPS, isShipUnlocked } from '../data/ships';
import { addBackdrop, getServices, makeTitleText, tr } from './helpers';
import { GameButton, FONT_STACK } from '../ui/widgets';
import { MenuList } from '../ui/hud';
import type { LocaleKey } from '../systems/locale/en';

export class ShipSelectScene extends Phaser.Scene {
  private shipIndex = 0;

  private diffIndex = 1;

  private cards: Phaser.GameObjects.Container[] = [];

  private diffButtons: GameButton[] = [];

  private startButton!: GameButton;

  private lockHints: Phaser.GameObjects.Text[] = [];

  private diffDescText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE.SHIP_SELECT);
  }

  create(): void {
    const { audio, save } = getServices(this);
    addBackdrop(this, 1);
    makeTitleText(this, GAME_WIDTH / 2, 90, tr(this, 'select.title'));

    const cleared = save.data.stagesCleared;
    this.cards = [];
    this.diffButtons = [];
    this.lockHints = [];
    this.rowIndex = 0;
    this.shipIndex = 0;
    this.diffIndex = 1;

    SHIPS.forEach((ship, i) => {
      const cx = GAME_WIDTH / 2 + (i - 1) * 168;
      const locked = !isShipUnlocked(ship.id, cleared);
      const card = this.add.container(cx, 300);
      const bg = this.add.graphics();
      card.add(bg);
      const img = this.add
        .image(0, -40, `ship_${ship.id}`)
        .setScale(1.35)
        .setAlpha(locked ? 0.28 : 1);
      card.add(img);
      const name = this.add
        .text(0, 42, tr(this, ship.nameKey as LocaleKey), {
          fontFamily: FONT_STACK,
          fontSize: '17px',
          color: '#e8e3d5',
        })
        .setOrigin(0.5);
      card.add(name);
      if (locked) {
        const lock = this.add
          .text(0, -100, tr(this, 'select.locked'), {
            fontFamily: FONT_STACK,
            fontSize: '15px',
            color: '#e8734a',
          })
          .setOrigin(0.5);
        card.add(lock);
        card.setData('locked', true);
      } else {
        card.setData('locked', false);
        const stats = this.drawStatBars(ship.id);
        stats.forEach((s) => card.add(s));
      }
      card.setSize(160, 240);
      card.setInteractive(
        new Phaser.Geom.Rectangle(-80, -120, 160, 240),
        Phaser.Geom.Rectangle.Contains,
      );
      card.on('pointerup', () => {
        this.shipIndex = i;
        this.refresh();
        audio.play('uiMove');
      });
      this.cards.push(card);
    });

    const hintY = 452;
    const hint1 = this.add
      .text(GAME_WIDTH / 2, hintY, '', {
        fontFamily: FONT_STACK,
        fontSize: '13px',
        color: '#8fa3c7',
        align: 'center',
        wordWrap: { width: 480 },
      })
      .setOrigin(0.5);
    hint1.name = 'unlockHint';
    this.lockHints.push(hint1);

    this.diffDescText = this.add
      .text(GAME_WIDTH / 2, 632, '', {
        fontFamily: FONT_STACK,
        fontSize: '13px',
        color: '#8fa3c7',
        align: 'center',
      })
      .setOrigin(0.5);

    makeTitleText(this, GAME_WIDTH / 2, 520, tr(this, 'select.difficulty'), 22).setColor('#cfd6e4');
    DIFFICULTY_ORDER.forEach((d, i) => {
      const btn = new GameButton(
        this,
        GAME_WIDTH / 2 + (i - 1) * 170,
        586,
        tr(this, DIFFICULTIES[d].nameKey as LocaleKey),
        {
          width: 156,
          height: 50,
          onSelect: () => {
            this.diffIndex = i;
            this.refresh();
          },
        },
      );
      this.diffButtons.push(btn);
    });

    this.startButton = new GameButton(this, GAME_WIDTH / 2, 700, `${tr(this, 'select.start')} ▶`, {
      width: 320,
      height: 64,
      onSelect: () => this.launch(),
    });

    new MenuList([this.startButton], {
      onMove: () => audio.play('uiMove'),
      onSelect: () => this.launch(),
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          if (this.rowIndex === 0) {
            this.shipIndex = (this.shipIndex + SHIPS.length - 1) % SHIPS.length;
            audio.play('uiMove');
          } else if (this.rowIndex === 1) {
            this.diffIndex = (this.diffIndex + 2) % 3;
            audio.play('uiMove');
          }
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (this.rowIndex === 0) {
            this.shipIndex = (this.shipIndex + 1) % SHIPS.length;
            audio.play('uiMove');
          } else if (this.rowIndex === 1) {
            this.diffIndex = (this.diffIndex + 1) % 3;
            audio.play('uiMove');
          }
          break;
        case 'ArrowUp':
        case 'KeyW':
          this.rowIndex = (this.rowIndex + 2) % 3;
          audio.play('uiMove');
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.rowIndex = (this.rowIndex + 1) % 3;
          audio.play('uiMove');
          break;
        case 'Enter':
        case 'Space':
        case 'NumpadEnter':
          event.preventDefault();
          if (this.rowIndex === 2) this.launch();
          break;
        case 'Escape':
          this.scene.start(SCENE.TITLE);
          break;
        default:
          break;
      }
      this.refresh();
    });

    this.refresh();
  }

  private rowIndex = 0;

  private drawStatBars(shipId: string): Phaser.GameObjects.GameObject[] {
    const stats: Record<string, [number, number, number]> = {
      lark: [3, 3, 3],
      kite: [5, 4, 2],
      rook: [2, 4, 5],
    };
    const [spd, pow, bomb] = stats[shipId];
    const out: Phaser.GameObjects.GameObject[] = [];
    const rows: Array<[string, number]> = [
      ['stat.speed', spd],
      ['stat.firepower', pow],
      ['stat.bomb', bomb],
    ];
    rows.forEach(([key, value], r) => {
      const label = this.add
        .text(-62, 66 + r * 20, tr(this, key as LocaleKey), {
          fontFamily: FONT_STACK,
          fontSize: '11px',
          color: '#8fa3c7',
        })
        .setOrigin(0, 0.5);
      out.push(label);
      for (let p = 0; p < 5; p++) {
        out.push(
          this.add
            .rectangle(10 + p * 14, 66 + r * 20, 9, 9, p < value ? 0xf2a35c : 0x2a3350)
            .setOrigin(0.5),
        );
      }
    });
    return out;
  }

  private currentShipLocked(): boolean {
    return this.cards[this.shipIndex].getData('locked') === true;
  }

  private refresh(): void {
    const { save } = getServices(this);
    this.cards.forEach((card, i) => {
      const selected = i === this.shipIndex;
      const locked = card.getData('locked') === true;
      const bg = card.list[0] as Phaser.GameObjects.Graphics;
      bg.clear();
      bg.fillStyle(locked ? 0x10141f : selected ? 0x24304e : 0x151c30, 0.95);
      bg.fillRoundedRect(-80, -120, 160, 250, 12);
      bg.lineStyle(selected && this.rowIndex === 0 ? 3 : 1.5, selected ? 0xf2a35c : 0x3a4460, 1);
      bg.strokeRoundedRect(-80, -120, 160, 250, 12);
      card.setScale(selected ? 1.04 : 1);
    });
    this.diffButtons.forEach((btn, i) =>
      btn.setFocused(i === this.diffIndex && this.rowIndex === 1),
    );
    const diffDef = DIFFICULTIES[DIFFICULTY_ORDER[this.diffIndex]];
    this.diffDescText?.setText(tr(this, `difficulty.${diffDef.id}.desc` as LocaleKey));
    this.startButton.setFocused(this.rowIndex === 2);
    const hint = this.lockHints[0];
    const ship = SHIPS[this.shipIndex];
    if (this.currentShipLocked()) {
      hint.setText(tr(this, ship.id === 'kite' ? 'select.unlockHint1' : 'select.unlockHint2'));
      hint.setColor('#e8734a');
      this.startButton.setDisabled(true);
    } else {
      hint.setText(tr(this, ship.descKey as LocaleKey));
      hint.setColor('#8fa3c7');
      this.startButton.setDisabled(false);
    }
    void save;
  }

  private launch(): void {
    if (this.currentShipLocked()) return;
    getServices(this).audio.play('uiConfirm');
    const difficulty = DIFFICULTY_ORDER[this.diffIndex];
    const diff = DIFFICULTIES[difficulty];
    const ship = SHIPS[this.shipIndex];
    const run: RunState = {
      shipId: ship.id,
      difficulty,
      stageIndex: 0,
      lives: diff.playerLives - 1,
      bombs: diff.startBombs + ship.startBombsBonus,
      power: 1,
      hasShield: false,
      score: 0,
      continuesUsed: 0,
      seed: randomSeed(),
    };
    this.scene.start(SCENE.BRIEFING, { run });
  }
}
