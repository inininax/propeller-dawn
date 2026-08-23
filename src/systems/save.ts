import type { DifficultyId, Language } from '../core/types';

export interface SettingsData {
  language: 'auto' | Language;
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  reduceFlash: boolean;
}

export interface SaveDataV1 {
  version: 1;
  hiscores: Record<DifficultyId, number>;
  stagesCleared: number;
  settings: SettingsData;
  tutorialDone: boolean;
}

export interface LoadResult {
  data: SaveDataV1;
  recovered: boolean;
  reason?: 'corrupt' | 'version' | 'invalid';
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_SETTINGS: SettingsData = {
  language: 'auto',
  muted: false,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  screenShake: true,
  reduceFlash: false,
};

export function defaultSave(): SaveDataV1 {
  return {
    version: 1,
    hiscores: { easy: 0, normal: 0, hard: 0 },
    stagesCleared: 0,
    settings: { ...DEFAULT_SETTINGS },
    tutorialDone: false,
  };
}

export const SAVE_SCHEMA_VERSION = 1;

function sanitizeSettings(input: unknown): SettingsData {
  const out: SettingsData = { ...DEFAULT_SETTINGS };
  if (typeof input !== 'object' || input === null) return out;
  const rec = input as Record<string, unknown>;
  if (rec.language === 'ko' || rec.language === 'en' || rec.language === 'auto') {
    out.language = rec.language;
  }
  if (typeof rec.muted === 'boolean') out.muted = rec.muted;
  if (typeof rec.musicVolume === 'number') {
    out.musicVolume = clamp01(rec.musicVolume);
  }
  if (typeof rec.sfxVolume === 'number') {
    out.sfxVolume = clamp01(rec.sfxVolume);
  }
  if (typeof rec.screenShake === 'boolean') out.screenShake = rec.screenShake;
  if (typeof rec.reduceFlash === 'boolean') out.reduceFlash = rec.reduceFlash;
  return out;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function migrate(raw: string | null): LoadResult {
  const base = defaultSave();
  if (raw === null || raw === '') {
    return { data: base, recovered: false };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { data: base, recovered: true, reason: 'corrupt' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { data: base, recovered: true, reason: 'corrupt' };
  }
  const rec = parsed as Record<string, unknown>;
  const version = typeof rec.version === 'number' ? rec.version : 0;
  if (version > SAVE_SCHEMA_VERSION) {
    return { data: base, recovered: true, reason: 'version' };
  }
  const data = defaultSave();
  let anyInvalid = version < SAVE_SCHEMA_VERSION;

  if (typeof rec.hiscores === 'object' && rec.hiscores !== null) {
    const hs = rec.hiscores as Record<string, unknown>;
    for (const key of ['easy', 'normal', 'hard'] as DifficultyId[]) {
      const v = hs[key];
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        data.hiscores[key] = Math.floor(v);
      } else {
        anyInvalid = true;
      }
    }
  } else {
    anyInvalid = true;
  }

  data.stagesCleared =
    typeof rec.stagesCleared === 'number' && rec.stagesCleared >= 0
      ? Math.min(2, Math.floor(rec.stagesCleared))
      : 0;

  data.settings = sanitizeSettings(rec.settings);
  data.tutorialDone = rec.tutorialDone === true;

  const result: LoadResult = { data, recovered: anyInvalid };
  if (anyInvalid) result.reason = 'version';
  return result;
}

export class SaveService {
  private cache: SaveDataV1;

  private lastError: 'quota' | 'unavailable' | null = null;

  constructor(
    private readonly storage: StorageLike,
    initial?: LoadResult,
  ) {
    this.cache = (initial ?? migrate(safeGet(storage))).data;
  }

  get data(): SaveDataV1 {
    return this.cache;
  }

  get saveDisabledReason(): 'quota' | 'unavailable' | null {
    return this.lastError;
  }

  persist(): boolean {
    try {
      this.storage.setItem('propeller-dawn.save.v1', JSON.stringify(this.cache));
      this.lastError = null;
      return true;
    } catch (e) {
      this.lastError =
        e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)
          ? 'quota'
          : 'unavailable';
      return false;
    }
  }

  submitScore(difficulty: DifficultyId, score: number): boolean {
    if (score > this.cache.hiscores[difficulty]) {
      this.cache.hiscores[difficulty] = score;
      return this.persist();
    }
    return true;
  }

  recordStageClear(stageIndex: number): void {
    if (stageIndex > this.cache.stagesCleared) {
      this.cache.stagesCleared = stageIndex;
      this.persist();
    }
  }

  markTutorialDone(): void {
    if (!this.cache.tutorialDone) {
      this.cache.tutorialDone = true;
      this.persist();
    }
  }

  updateSettings(patch: Partial<SettingsData>): void {
    this.cache.settings = { ...this.cache.settings, ...patch };
    this.persist();
  }

  resetAll(): void {
    this.cache = defaultSave();
    this.persist();
  }
}

function safeGet(storage: StorageLike): string | null {
  try {
    return storage.getItem('propeller-dawn.save.v1');
  } catch {
    return null;
  }
}

export function createBrowserStorage(): StorageLike {
  return {
    getItem: (k) => window.localStorage.getItem(k),
    setItem: (k, v) => window.localStorage.setItem(k, v),
    removeItem: (k) => window.localStorage.removeItem(k),
  };
}

export class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}
