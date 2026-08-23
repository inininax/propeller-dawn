import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveService, defaultSave, migrate } from '@/systems/save';

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
});

describe('save service', () => {
  it('persists and loads a full roundtrip', () => {
    const svc = new SaveService(storage);
    svc.submitScore('normal', 123456);
    svc.updateSettings({ musicVolume: 0.3 });
    svc.markTutorialDone();

    const loaded = new SaveService(storage);
    expect(loaded.data.hiscores.normal).toBe(123456);
    expect(loaded.data.settings.musicVolume).toBeCloseTo(0.3);
    expect(loaded.data.tutorialDone).toBe(true);
  });

  it('only updates hiscore when beaten', () => {
    const svc = new SaveService(storage);
    expect(svc.submitScore('hard', 500)).toBe(true);
    expect(svc.submitScore('hard', 300)).toBe(true);
    expect(svc.data.hiscores.hard).toBe(500);
  });

  it('records stage clears monotonically', () => {
    const svc = new SaveService(storage);
    svc.recordStageClear(1);
    svc.recordStageClear(2);
    svc.recordStageClear(1);
    expect(svc.data.stagesCleared).toBe(2);
  });

  it('resets everything on demand', () => {
    const svc = new SaveService(storage);
    svc.markTutorialDone();
    svc.submitScore('easy', 999);
    svc.resetAll();
    expect(svc.data).toEqual(defaultSave());
  });

  it('survives corrupted JSON with recovery flag', () => {
    storage.setItem('propeller-dawn.save.v1', '{not json!!');
    const result = migrate('{not json!!');
    expect(result.recovered).toBe(true);
    expect(result.reason).toBe('corrupt');
    expect(result.data).toEqual(defaultSave());
  });

  it('rejects future schema versions safely', () => {
    const raw = JSON.stringify({ version: 99, hiscores: { easy: 5 } });
    const result = migrate(raw);
    expect(result.recovered).toBe(true);
    expect(result.reason).toBe('version');
    expect(result.data.hiscores.easy).toBe(0);
  });

  it('sanitizes invalid field values instead of crashing', () => {
    const raw = JSON.stringify({
      version: 1,
      hiscores: { easy: 'lots', normal: -5, hard: 12.7 },
      settings: { language: 'fr', musicVolume: 42 },
      stagesCleared: 'many',
    });
    const result = migrate(raw);
    expect(result.data.hiscores.easy).toBe(0);
    expect(result.data.hiscores.normal).toBe(0);
    expect(result.data.hiscores.hard).toBe(12);
    expect(result.data.settings.language).toBe('auto');
    expect(result.data.settings.musicVolume).toBe(1);
    expect(result.data.stagesCleared).toBe(0);
  });
});
