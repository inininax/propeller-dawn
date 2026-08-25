import { describe, expect, it } from 'vitest';
import {
  LocalLeaderboardStore,
  entryFromRun,
  sortEntries,
  type LeaderboardEntry,
} from '@/systems/leaderboard';
import { MemoryStorage } from '@/systems/save';

function make(over: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    score: 1000,
    shipId: 'lark',
    difficulty: 'normal',
    grazeCount: 5,
    maxCombo: 12,
    clearedStages: 1,
    finishedAt: 1_000,
    ...over,
  };
}

function store(): LocalLeaderboardStore {
  return new LocalLeaderboardStore(new MemoryStorage());
}

describe('leaderboard store', () => {
  it('ranks submissions by score descending', async () => {
    const s = store();
    await s.submit(make({ score: 500, finishedAt: 1 }));
    const { rank } = await s.submit(make({ score: 900, finishedAt: 2 }));
    expect(rank).toBe(1);
    await s.submit(make({ score: 700, finishedAt: 3 }));
    const top = await s.top('normal', 10);
    expect(top.map((e) => e.score)).toEqual([900, 700, 500]);
  });

  it('filters by difficulty', async () => {
    const s = store();
    await s.submit(make({ score: 900, difficulty: 'hard' }));
    await s.submit(make({ score: 800, difficulty: 'normal' }));
    const top = await s.top('hard', 10);
    expect(top).toHaveLength(1);
    expect(top[0].score).toBe(900);
  });

  it('ties break by earlier finish time', () => {
    const ranked = sortEntries([
      make({ score: 900, finishedAt: 20 }),
      make({ score: 900, finishedAt: 10 }),
    ]);
    expect(ranked[0].finishedAt).toBe(10);
  });

  it('survives corrupted storage and caps entries at 100', async () => {
    const mem = new MemoryStorage();
    mem.setItem('propeller-dawn.leaderboard.v1', '{broken');
    const s = new LocalLeaderboardStore(mem);
    expect(await s.top('normal', 5)).toEqual([]);

    for (let i = 0; i < 120; i++) {
      await s.submit(make({ score: i, finishedAt: i }));
    }
    const all = await s.top('normal', 999);
    expect(all.length).toBeLessThanOrEqual(100);
  });

  it('ignores malformed entries on load', async () => {
    const mem = new MemoryStorage();
    mem.setItem(
      'propeller-dawn.leaderboard.v1',
      JSON.stringify([{ score: 'big' }, make({ score: 42 })]),
    );
    const s = new LocalLeaderboardStore(mem);
    const top = await s.top('normal', 10);
    expect(top).toHaveLength(1);
    expect(top[0].score).toBe(42);
  });

  it('entryFromRun maps run fields', () => {
    const e = entryFromRun({ shipId: 'kite', difficulty: 'hard', score: 77777 }, 31, 44, 2);
    expect(e).toMatchObject({
      shipId: 'kite',
      difficulty: 'hard',
      score: 77777,
      grazeCount: 31,
      maxCombo: 44,
      clearedStages: 2,
    });
  });
});
