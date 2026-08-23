import { describe, expect, it } from 'vitest';
import {
  applyFocusSpeed,
  keyToGameCommand,
  keyToMenuCommand,
  keyboardVector,
  relativeDragToVector,
} from '@/systems/input/commands';
import type { GameCommand } from '@/systems/input/commands';
import { MenuKeyFilter } from '@/systems/input/menuFilter';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '@/data/difficulty';

describe('input command mapping', () => {
  it('maps keyboard codes to game commands', () => {
    expect(keyToGameCommand('ArrowLeft')).toBe('left');
    expect(keyToGameCommand('KeyW')).toBe('up');
    expect(keyToGameCommand('Space')).toBe('fire');
    expect(keyToGameCommand('KeyX')).toBe('bomb');
    expect(keyToGameCommand('ShiftLeft')).toBe('bomb');
    expect(keyToGameCommand('KeyZ')).toBe('focus');
    expect(keyToGameCommand('KeyQ')).toBeNull();
  });

  it('normalizes diagonal keyboard input', () => {
    const set = new Set<GameCommand>(['left', 'up']);
    const vec = keyboardVector(set);
    expect(vec.x).toBeCloseTo(-Math.SQRT1_2);
    expect(vec.y).toBeCloseTo(-Math.SQRT1_2);
  });

  it('focus mode slows the ship', () => {
    expect(applyFocusSpeed(300, 0.5, false)).toBe(300);
    expect(applyFocusSpeed(300, 0.5, true)).toBe(150);
  });

  it('relative drag converts to a normalized vector with clamp', () => {
    const v = relativeDragToVector(100, 100, 160, 100, 60);
    expect(v.x).toBe(1);
    const clamped = relativeDragToVector(100, 100, 300, 100, 60);
    expect(clamped.x).toBe(1);
    const none = relativeDragToVector(100, 100, 100, 100, 60);
    expect(none.x).toBe(0);
    expect(none.y).toBe(0);
  });

  it('menu commands include confirm and back', () => {
    expect(keyToMenuCommand('Enter')).toBe('confirm');
    expect(keyToMenuCommand('Space')).toBe('confirm');
    expect(keyToMenuCommand('Escape')).toBe('back');
    expect(keyToMenuCommand('ArrowDown')).toBe('down');
  });

  it('menu key filter debounces repeats but allows spaced presses', () => {
    const filter = new MenuKeyFilter(200);
    expect(filter.accept('down', 100)).toBe(true);
    expect(filter.accept('down', 150)).toBe(false);
    expect(filter.accept('down', 400)).toBe(true);
    expect(filter.accept('confirm', 400)).toBe(true);
  });
});

describe('difficulty tuning', () => {
  it('hard is strictly harder than easy on every axis except rewards', () => {
    for (const key of ['enemySpeedMult', 'bulletSpeedMult', 'bossHpMult'] as const) {
      expect(DIFFICULTIES.hard[key]).toBeGreaterThan(DIFFICULTIES.easy[key]);
    }
    expect(DIFFICULTIES.hard.fireIntervalMult).toBeLessThan(DIFFICULTIES.easy.fireIntervalMult);
    expect(DIFFICULTIES.easy.playerLives).toBeGreaterThan(DIFFICULTIES.normal.playerLives);
    expect(DIFFICULTIES.hard.scoreMult).toBeGreaterThan(DIFFICULTIES.easy.scoreMult);
  });

  it('exposes exactly three difficulty levels', () => {
    expect(DIFFICULTY_ORDER).toEqual(['easy', 'normal', 'hard']);
  });
});
