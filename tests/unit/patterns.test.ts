import { describe, expect, it } from 'vitest';
import { SeededRandom } from '@/core/rng';
import { PATTERNS, generateSplit } from '@/systems/patterns';

const ctx = (over: Partial<Parameters<typeof PATTERNS.aimed>[0]> = {}) => ({
  x: 100,
  y: 100,
  aimAngleRad: Math.PI / 2,
  timeMs: 0,
  rng: new SeededRandom(99),
  ...over,
});

describe('bullet patterns', () => {
  it('aimed produces the requested count around the aim angle', () => {
    const spawns = PATTERNS.aimed(ctx(), { count: 5, spreadDeg: 30, speed: 200 });
    expect(spawns).toHaveLength(5);
    const angles = spawns.map((s) => Math.atan2(s.vy, s.vx));
    for (const angle of angles) {
      const diff = Math.abs(angle - Math.PI / 2);
      expect(diff).toBeLessThanOrEqual((15 * Math.PI) / 180 + 0.001);
    }
  });

  it('ring distributes bullets evenly', () => {
    const spawns = PATTERNS.ring(ctx(), { count: 12, speed: 140 });
    expect(spawns).toHaveLength(12);
    for (const s of spawns) {
      const speed = Math.hypot(s.vx, s.vy);
      expect(speed).toBeCloseTo(140, 5);
    }
  });

  it('wallWithGap leaves a safe gap', () => {
    const spawns = PATTERNS.wallWithGap(ctx({ y: -20 }), {
      fieldWidth: 540,
      gapXFrac: 0.5,
      gapWidthPx: 120,
      spacingPx: 40,
      speed: 150,
    });
    expect(spawns.length).toBeGreaterThan(4);
    for (const s of spawns) {
      expect(Math.abs(s.x - 270)).toBeGreaterThan(60);
      expect(s.vy).toBeGreaterThan(0);
    }
  });

  it('splitOrb carries split metadata', () => {
    const [orb] = PATTERNS.splitOrb(ctx(), { splitCount: 8, delayMs: 900, splitSpeed: 180 });
    expect(orb.splitAtMs).toBe(900);
    expect(orb.splitCount).toBe(8);
    const shards = generateSplit(orb);
    expect(shards).toHaveLength(8);
    for (const shard of shards) {
      expect(Math.hypot(shard.vx, shard.vy)).toBeCloseTo(180, 5);
    }
  });

  it('spiralBurst rotates with time making patterns readable and varied', () => {
    const early = PATTERNS.spiralBurst(ctx({ timeMs: 0 }), { arms: 3, speed: 120 });
    const later = PATTERNS.spiralBurst(ctx({ timeMs: 800 }), { arms: 3, speed: 120 });
    expect(early.length).toBeGreaterThan(0);
    expect(later.length).toBeGreaterThan(0);
    expect(early[0].vx).not.toBeCloseTo(later[0].vx, 3);
  });

  it('fanBurst stays deterministic under a fixed seed', () => {
    const a = PATTERNS.fanBurst(ctx(), { count: 5, spreadDeg: 60, speed: 160, wobbleDeg: 8 });
    const b = PATTERNS.fanBurst(ctx(), { count: 5, spreadDeg: 60, speed: 160, wobbleDeg: 8 });
    expect(a.map((s) => [s.vx, s.vy])).toEqual(b.map((s) => [s.vx, s.vy]));
  });
});
