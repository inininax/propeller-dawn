import { describe, expect, it } from 'vitest';
import { ENEMIES } from '@/data/enemies';
import { STAGES } from '@/data/stages';
import { WaveRunner } from '@/systems/waves';

describe('stage data integrity', () => {
  it('every spawned enemy exists in the bestiary', () => {
    for (const stage of STAGES) {
      for (const wave of stage.waves) {
        for (const spawn of wave.spawns) {
          expect(ENEMIES[spawn.enemyId], `${stage.nameKey}: ${spawn.enemyId}`).toBeDefined();
        }
        if (wave.bossId) {
          expect(
            wave.bossId === 'solbreaker' ||
              wave.bossId === 'emberCrown' ||
              wave.bossId === stage.midBossId,
            `boss ${wave.bossId}`,
          ).toBe(true);
        }
      }
    }
  });

  it('each stage has at least 10 sections plus a midboss and final boss', () => {
    for (const stage of STAGES) {
      const sections = new Set(stage.waves.map((w) => w.section));
      expect(sections.size).toBeGreaterThanOrEqual(10);
      expect(stage.midBossId).toBeDefined();
      expect(stage.finalBossId).toBeDefined();
      const bossWaves = stage.waves.filter((w) => w.bossId !== undefined);
      expect(bossWaves.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('waves are sorted by time and start early', () => {
    for (const stage of STAGES) {
      for (let i = 1; i < stage.waves.length; i++) {
        expect(stage.waves[i].atSec).toBeGreaterThanOrEqual(stage.waves[i - 1].atSec);
      }
      expect(stage.waves[0].atSec).toBeLessThanOrEqual(5);
    }
  });

  it('campaign pacing meets the 12+ minute target on paper', () => {
    const s1 = STAGES[0];
    const s2 = STAGES[1];
    const s1Combat = s1.waves[s1.waves.length - 2].atSec;
    const s2Combat = s2.waves[s2.waves.length - 2].atSec;
    expect(s1Combat + s2Combat).toBeGreaterThanOrEqual(480);
  });

  it('first 60 seconds contain only gentle waves', () => {
    const first = STAGES[0].waves.filter((w) => w.atSec < 60);
    for (const wave of first) {
      for (const spawn of wave.spawns) {
        expect(['scoutFinch', 'hookInterceptor', 'morrowBomber', 'cradleCarrier']).toContain(
          spawn.enemyId,
        );
      }
    }
  });
});

describe('WaveRunner', () => {
  const waves = [
    { atSec: 1, section: 1, spawns: [], bannerKey: undefined },
    { atSec: 3, section: 2, spawns: [], bannerKey: undefined },
    { atSec: 6.5, section: 3, spawns: [] },
  ].map((w) => ({ ...w, bannerKey: w.bannerKey as string | undefined }));

  function makeRunner(): WaveRunner {
    return new WaveRunner(waves as never);
  }

  it('emits due events in chronological order across ticks', () => {
    const runner = makeRunner();
    expect(runner.update(1500)).toHaveLength(1);
    expect(runner.update(1400)).toHaveLength(0);
    expect(runner.update(1000)).toHaveLength(1);
    const batch = runner.update(3000);
    expect(batch).toHaveLength(1);
    expect(runner.finished).toBe(true);
  });

  it('skipTo jumps forward for debug warps', () => {
    const runner = makeRunner();
    runner.skipTo(6000);
    const due = runner.update(600);
    expect(due).toHaveLength(3);
    expect(runner.finished).toBe(true);
  });
});
