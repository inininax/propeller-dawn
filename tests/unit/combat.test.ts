import { describe, expect, it } from 'vitest';
import { applyDamage, canTakeDamage, circlesOverlap, grantInvulnerability } from '@/systems/combat';
import { addPower, applyDeathPenalty, clampPower } from '@/systems/powerup';

describe('combat helpers', () => {
  it('overlapping and non-overlapping circles', () => {
    expect(circlesOverlap({ x: 0, y: 0, r: 5 }, { x: 8, y: 0, r: 4 })).toBe(true);
    expect(circlesOverlap({ x: 0, y: 0, r: 5 }, { x: 20, y: 20, r: 4 })).toBe(false);
  });

  it('applyDamage never over-kills', () => {
    const enemy = { hp: 10 };
    expect(applyDamage(enemy, 30)).toBe(10);
    expect(enemy.hp).toBe(0);
  });

  it('invulnerability blocks damage until timer expires', () => {
    const player = { invulnMsRemaining: 1000 };
    expect(canTakeDamage(player, 500)).toBe(false);
    expect(canTakeDamage(player, 400)).toBe(false);
    expect(canTakeDamage(player, 200)).toBe(true);
  });

  it('grantInvulnerability keeps the longer duration', () => {
    const player = { invulnMsRemaining: 800 };
    grantInvulnerability(player, 300);
    expect(player.invulnMsRemaining).toBe(800);
    grantInvulnerability(player, 2500);
    expect(player.invulnMsRemaining).toBe(2500);
  });
});

describe('powerup levels', () => {
  it('clamps power between 1 and 3', () => {
    expect(clampPower(0)).toBe(1);
    expect(clampPower(2)).toBe(2);
    expect(clampPower(99)).toBe(3);
  });

  it('addPower reports maxed state', () => {
    expect(addPower(1, 1)).toEqual({ power: 2, maxedOut: false });
    expect(addPower(2, 1)).toEqual({ power: 3, maxedOut: false });
    expect(addPower(3, 1)).toEqual({ power: 3, maxedOut: true });
  });

  it('death penalty reduces but never below level 1', () => {
    expect(applyDeathPenalty(3)).toBe(2);
    expect(applyDeathPenalty(1)).toBe(1);
    expect(applyDeathPenalty(3, 5)).toBe(1);
  });
});
