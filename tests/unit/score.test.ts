import { beforeEach, describe, expect, it } from 'vitest';
import {
  createScoreState,
  registerGraze,
  registerItemPickup,
  registerKill,
  stageClearBonus,
  tickScore,
} from '@/systems/score';

let state = createScoreState();
const cfg = {
  comboWindowMs: 2000,
  multStepCombo: 10,
  multStepValue: 0.5,
  maxMultiplier: 8,
};

beforeEach(() => {
  state = createScoreState();
});

describe('score and combo', () => {
  it('awards base points with multiplier 1 at combo start', () => {
    const gained = registerKill(state, 300, 1000, cfg);
    expect(gained).toBe(300);
    expect(state.combo).toBe(1);
    expect(state.multiplier).toBe(1);
  });

  it('increases multiplier every 10 combos up to the cap', () => {
    let now = 0;
    for (let i = 1; i <= 25; i++) {
      now += 200;
      registerKill(state, 100, now, cfg);
    }
    expect(state.combo).toBe(25);
    expect(state.multiplier).toBeCloseTo(2);
    for (let i = 26; i <= 150; i++) {
      now += 200;
      registerKill(state, 100, now, cfg);
    }
    expect(state.multiplier).toBe(8);
  });

  it('resets combo after the window elapses', () => {
    registerKill(state, 100, 0, cfg);
    registerKill(state, 100, 1500, cfg);
    expect(state.combo).toBe(2);
    tickScore(state, 1500 + 2001, cfg);
    expect(state.combo).toBe(0);
    expect(state.multiplier).toBe(1);
  });

  it('counts grazes once per call', () => {
    registerGraze(state, 100);
    registerGraze(state, 100);
    expect(state.grazeCount).toBe(2);
    expect(state.score).toBe(200);
  });
});

describe('item chain', () => {
  it('scales medal value with chain within window', () => {
    const a = registerItemPickup(state, 300, 0);
    expect(a.valueGained).toBe(300);
    const b = registerItemPickup(state, 300, 500);
    expect(b.valueGained).toBe(600);
    const c = registerItemPickup(state, 300, 900);
    expect(c.valueGained).toBe(900);
  });

  it('caps chain multiplier at 10', () => {
    for (let i = 0; i < 15; i++) {
      registerItemPickup(state, 100, i * 100);
    }
    expect(state.itemChain).toBe(15);
    const last = registerItemPickup(state, 100, 1600);
    expect(last.chain).toBe(10);
    expect(last.valueGained).toBe(1000);
  });

  it('resets chain when window expires', () => {
    registerItemPickup(state, 100, 0);
    registerItemPickup(state, 100, 100);
    const later = registerItemPickup(state, 100, 100 + 3001);
    expect(later.chain).toBe(1);
  });
});

describe('stage clear bonus', () => {
  it('computes lives and bombs bonus scaled by difficulty', () => {
    const bonus = stageClearBonus({
      livesLeft: 3,
      bombsLeft: 2,
      difficultyMult: 1,
    });
    expect(bonus).toBe(40000);
    expect(stageClearBonus({ livesLeft: 2, bombsLeft: 1, difficultyMult: 1.5 })).toBe(37500);
  });
});
