import { describe, expect, it } from 'vitest';
import { SeededRandom } from '@/core/rng';

describe('SeededRandom', () => {
  it('produces identical sequences for identical seeds', () => {
    const a = new SeededRandom(1234);
    const b = new SeededRandom(1234);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('stays within [0, 1) and range bounds', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    for (let i = 0; i < 500; i++) {
      const v = rng.range(5, 9);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(9);
    }
  });

  it('int() never returns maxExclusive', () => {
    const rng = new SeededRandom(7);
    for (let i = 0; i < 200; i++) {
      const v = rng.int(6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});
