export interface LeaderboardEntry {
  readonly score: number;
  readonly shipId: string;
  readonly difficulty: 'easy' | 'normal' | 'hard';
  readonly grazeCount: number;
  readonly maxCombo: number;
  readonly clearedStages: number;
  readonly finishedAt: number;
}

export interface LeaderboardStore {
  submit(entry: LeaderboardEntry): Promise<{ rank: number | null }>;
  top(difficulty: LeaderboardEntry['difficulty'], limit: number): Promise<LeaderboardEntry[]>;
  rankOf(entry: LeaderboardEntry): Promise<number | null>;
}

const KEY = 'propeller-dawn.leaderboard.v1';
const MAX_ENTRIES = 100;

function isEntry(v: unknown): v is LeaderboardEntry {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.score === 'number' &&
    typeof r.shipId === 'string' &&
    (r.difficulty === 'easy' || r.difficulty === 'normal' || r.difficulty === 'hard') &&
    typeof r.grazeCount === 'number' &&
    typeof r.maxCombo === 'number' &&
    typeof r.clearedStages === 'number' &&
    typeof r.finishedAt === 'number'
  );
}

export function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || a.finishedAt - b.finishedAt);
}

export class LocalLeaderboardStore implements LeaderboardStore {
  constructor(
    private readonly storage: {
      getItem(key: string): string | null;
      setItem(key: string, value: string): void;
    },
  ) {}

  private load(): LeaderboardEntry[] {
    try {
      const raw = this.storage.getItem(KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isEntry).slice(0, MAX_ENTRIES);
    } catch {
      return [];
    }
  }

  private save(entries: LeaderboardEntry[]): void {
    try {
      this.storage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    } catch {
      // leaderboard persistence is best-effort; never blocks play
    }
  }

  async submit(entry: LeaderboardEntry): Promise<{ rank: number | null }> {
    const entries = this.load();
    const next = sortEntries([...entries, entry]);
    this.save(next);
    return { rank: next.indexOf(entry) === -1 ? null : next.indexOf(entry) + 1 };
  }

  async top(
    difficulty: LeaderboardEntry['difficulty'],
    limit: number,
  ): Promise<LeaderboardEntry[]> {
    return sortEntries(this.load())
      .filter((e) => e.difficulty === difficulty)
      .slice(0, Math.max(1, limit));
  }

  async rankOf(entry: LeaderboardEntry): Promise<number | null> {
    const ranked = sortEntries(this.load());
    const idx = ranked.findIndex(
      (e) =>
        e.score === entry.score &&
        e.finishedAt === entry.finishedAt &&
        e.difficulty === entry.difficulty,
    );
    return idx === -1 ? null : idx + 1;
  }
}

export function createBrowserLeaderboardStore(): LeaderboardStore {
  return new LocalLeaderboardStore(window.localStorage);
}

export function entryFromRun(
  run: { shipId: string; difficulty: 'easy' | 'normal' | 'hard'; score: number },
  grazeCount: number,
  maxCombo: number,
  clearedStages: number,
): LeaderboardEntry {
  return {
    score: run.score,
    shipId: run.shipId,
    difficulty: run.difficulty,
    grazeCount,
    maxCombo,
    clearedStages,
    finishedAt: Date.now(),
  };
}
