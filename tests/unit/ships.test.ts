import { describe, expect, it } from 'vitest';
import { SHIPS, getShip } from '@/data/ships';
import { MOVES } from '@/data/enemies';

describe('ship data', () => {
  it('provides three distinct ships', () => {
    expect(SHIPS).toHaveLength(3);
    const ids = new Set(SHIPS.map((s) => s.id));
    expect(ids.size).toBe(3);
    expect(() => getShip('lark')).not.toThrow();
    expect(() => getShip('nonexistent')).toThrow();
  });

  it('kite is fastest and rook slowest with distinct bomb radii', () => {
    const [lark, kite, rook] = SHIPS;
    expect(kite.speed).toBeGreaterThan(lark.speed);
    expect(lark.speed).toBeGreaterThan(rook.speed);
    expect(rook.bombRadius).toBeGreaterThan(lark.bombRadius);
    expect(lark.bombRadius).toBeGreaterThan(kite.bombRadius);
  });

  it('weapon levels scale up monotonically in total damage', () => {
    for (const ship of SHIPS) {
      const totals = ship.weapon.map(
        (lvl) => lvl.shots.reduce((sum, s) => sum + s.damage, 0) / lvl.intervalMs,
      );
      for (let i = 1; i < totals.length; i++) {
        expect(totals[i]).toBeGreaterThan(totals[i - 1]);
      }
    }
  });
});

describe('enemy movement paths', () => {
  it('all paths start on-screen edges and terminate', () => {
    for (const [id, move] of Object.entries(MOVES)) {
      const entryY = id === 'rearDash' ? 1010 : -60;
      const start = move(0, 270, entryY);
      if (id === 'rearDash') {
        expect(start.y).toBeGreaterThan(900);
      } else {
        expect(start.y, id).toBeLessThan(200);
      }
      let done = false;
      let t = 0;
      for (let i = 0; i < 4000 && !done; i++) {
        t += 0.05;
        done = move(t, 270, entryY).done || move(t, 100, entryY).done || move(t, 440, entryY).done;
      }
      expect(done, `${id} never finishes`).toBe(true);
    }
  });

  it('hover paths keep enemies on screen during hold phase', () => {
    for (let t = 2; t < 8; t += 0.5) {
      const p = MOVES.hoverTop(t, 270, -60);
      expect(p.y).toBeLessThan(500);
      expect(p.x).toBeGreaterThan(-50);
      expect(p.x).toBeLessThan(590);
    }
  });
});
