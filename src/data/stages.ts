import type { StageDef, WaveEvent, WaveSpawnAction } from '../core/types';

function spawn(
  enemyId: string,
  xFrac: number,
  count = 1,
  spacingPx = 0,
  yFrac?: number,
): WaveSpawnAction {
  return yFrac === undefined
    ? { enemyId, xFrac, count, spacingPx }
    : { enemyId, xFrac, count, spacingPx, yFrac };
}

export const STAGE1: StageDef = {
  id: 1,
  nameKey: 'stage.1.name',
  subKey: 'stage.1.sub',
  theme: 'dawn',
  durationTargetSec: 360,
  midBossId: 'aegisKite',
  finalBossId: 'solbreaker',
  waves: sortStage([
    {
      atSec: 2,
      section: 1,
      bannerKey: 'banner.stage1',
      spawns: [spawn('scoutFinch', 0.3, 3, 60), spawn('scoutFinch', 0.7, 3, 60)],
    },
    { atSec: 10, section: 2, spawns: [spawn('scoutFinch', 0.5, 5, 55)] },
    {
      atSec: 18,
      section: 3,
      spawns: [spawn('hookInterceptor', 0.25, 2, 70), spawn('hookInterceptor', 0.75, 2, 70)],
    },
    {
      atSec: 28,
      section: 4,
      spawns: [spawn('scoutFinch', 0.2, 4, 50), spawn('scoutFinch', 0.8, 4, 50)],
    },
    { atSec: 38, section: 5, spawns: [spawn('morrowBomber', 0.5)] },
    {
      atSec: 48,
      section: 6,
      spawns: [spawn('hookInterceptor', 0.35, 3, 65), spawn('hookInterceptor', 0.65, 3, 65)],
    },
    {
      atSec: 58,
      section: 7,
      spawns: [
        spawn('cradleCarrier', 0.5),
        spawn('scoutFinch', 0.25, 3, 55),
        spawn('scoutFinch', 0.75, 3, 55),
      ],
    },
    {
      atSec: 72,
      section: 8,
      spawns: [
        spawn('scoutFinch', 0.15, 5, 45),
        spawn('scoutFinch', 0.85, 5, 45),
        spawn('hookInterceptor', 0.5, 2, 80),
      ],
    },
    { atSec: 84, section: 9, spawns: [spawn('morrowBomber', 0.3), spawn('morrowBomber', 0.7)] },
    {
      atSec: 96,
      section: 10,
      spawns: [
        spawn('hookInterceptor', 0.2, 4, 60),
        spawn('hookInterceptor', 0.8, 4, 60),
        spawn('scoutFinch', 0.5, 4, 50),
      ],
    },
    {
      atSec: 112,
      section: 11,
      spawns: [
        spawn('cradleCarrier', 0.35),
        spawn('cradleCarrier', 0.65),
        spawn('scoutFinch', 0.5, 6, 45),
      ],
    },
    { atSec: 128, section: 12, bannerKey: 'banner.midboss', bossId: 'aegisKite', spawns: [] },
    {
      atSec: 148,
      section: 13,
      spawns: [
        spawn('scoutFinch', 0.25, 5, 50),
        spawn('scoutFinch', 0.75, 5, 50),
        spawn('morrowBomber', 0.5),
      ],
    },
    {
      atSec: 164,
      section: 14,
      spawns: [spawn('hookInterceptor', 0.3, 4, 60), spawn('hookInterceptor', 0.7, 4, 60)],
    },
    {
      atSec: 178,
      section: 15,
      spawns: [
        spawn('morrowBomber', 0.25),
        spawn('morrowBomber', 0.75),
        spawn('scoutFinch', 0.5, 6, 45),
      ],
    },
    {
      atSec: 194,
      section: 16,
      spawns: [
        spawn('cradleCarrier', 0.5),
        spawn('hookInterceptor', 0.25, 3, 65),
        spawn('hookInterceptor', 0.75, 3, 65),
      ],
    },
    {
      atSec: 212,
      section: 17,
      spawns: [
        spawn('scoutFinch', 0.2, 6, 42),
        spawn('scoutFinch', 0.8, 6, 42),
        spawn('hookInterceptor', 0.5, 3, 70),
      ],
    },
    {
      atSec: 230,
      section: 18,
      spawns: [
        spawn('morrowBomber', 0.33),
        spawn('morrowBomber', 0.66),
        spawn('scoutFinch', 0.15, 4, 48),
        spawn('scoutFinch', 0.85, 4, 48),
      ],
    },
    { atSec: 250, section: 19, bannerKey: 'banner.boss', bossId: 'solbreaker', spawns: [] },
  ]),
};

function sortStage(waves: WaveEvent[]): WaveEvent[] {
  return [...waves].sort((a, b) => a.atSec - b.atSec || a.section - b.section);
}

export const STAGE2: StageDef = {
  id: 2,
  nameKey: 'stage.2.name',
  subKey: 'stage.2.sub',
  theme: 'ember',
  durationTargetSec: 400,
  midBossId: 'vulcanRook',
  finalBossId: 'emberCrown',
  waves: sortStage([
    {
      atSec: 2,
      section: 1,
      bannerKey: 'banner.stage2',
      spawns: [spawn('razorSwift', 0.3, 2, 90, 1.06), spawn('razorSwift', 0.7, 2, 90, 1.06)],
    },
    {
      atSec: 11,
      section: 2,
      spawns: [spawn('cinderRay', 0.25, 2, 110), spawn('cinderRay', 0.75, 2, 110)],
    },
    { atSec: 22, section: 3, spawns: [spawn('beaconWasp', 0.35), spawn('beaconWasp', 0.65)] },
    {
      atSec: 34,
      section: 4,
      spawns: [
        spawn('razorSwift', 0.2, 3, 80, 1.06),
        spawn('cinderRay', 0.6, 2, 120),
        spawn('scoutFinch', 0.4, 4, 50),
      ],
    },
    { atSec: 47, section: 5, spawns: [spawn('bulwarkCruiser', 0.5)] },
    {
      atSec: 62,
      section: 6,
      spawns: [
        spawn('cinderRay', 0.3, 3, 100),
        spawn('beaconWasp', 0.7),
        spawn('razorSwift', 0.5, 3, 85, 1.06),
      ],
    },
    {
      atSec: 76,
      section: 7,
      spawns: [
        spawn('scoutFinch', 0.2, 5, 46),
        spawn('scoutFinch', 0.8, 5, 46),
        spawn('cinderRay', 0.5, 2, 130),
      ],
    },
    {
      atSec: 90,
      section: 8,
      spawns: [
        spawn('beaconWasp', 0.25),
        spawn('beaconWasp', 0.5),
        spawn('beaconWasp', 0.75),
        spawn('razorSwift', 0.35, 2, 95, 1.06),
        spawn('razorSwift', 0.65, 2, 95, 1.06),
      ],
    },
    {
      atSec: 106,
      section: 9,
      spawns: [spawn('bulwarkCruiser', 0.3), spawn('cinderRay', 0.7, 2, 115)],
    },
    {
      atSec: 122,
      section: 10,
      spawns: [
        spawn('razorSwift', 0.15, 4, 75, 1.06),
        spawn('razorSwift', 0.85, 4, 75, 1.06),
        spawn('cinderRay', 0.4, 2, 120),
        spawn('cinderRay', 0.6, 2, 120),
      ],
    },
    { atSec: 140, section: 11, bannerKey: 'banner.midboss', bossId: 'vulcanRook', spawns: [] },
    {
      atSec: 162,
      section: 12,
      spawns: [
        spawn('cinderRay', 0.25, 2, 110),
        spawn('cinderRay', 0.75, 2, 110),
        spawn('beaconWasp', 0.5),
      ],
    },
    {
      atSec: 176,
      section: 13,
      spawns: [spawn('bulwarkCruiser', 0.65), spawn('razorSwift', 0.3, 3, 85, 1.06)],
    },
    {
      atSec: 192,
      section: 14,
      spawns: [
        spawn('scoutFinch', 0.2, 6, 44),
        spawn('scoutFinch', 0.8, 6, 44),
        spawn('beaconWasp', 0.35),
        spawn('beaconWasp', 0.65),
      ],
    },
    {
      atSec: 208,
      section: 15,
      spawns: [
        spawn('cinderRay', 0.3, 3, 105),
        spawn('cinderRay', 0.7, 3, 105),
        spawn('razorSwift', 0.5, 4, 80, 1.06),
      ],
    },
    {
      atSec: 226,
      section: 16,
      spawns: [
        spawn('bulwarkCruiser', 0.35),
        spawn('bulwarkCruiser', 0.68),
        spawn('razorSwift', 0.5, 3, 90, 1.06),
      ],
    },
    {
      atSec: 246,
      section: 17,
      spawns: [
        spawn('beaconWasp', 0.2),
        spawn('beaconWasp', 0.4),
        spawn('beaconWasp', 0.6),
        spawn('beaconWasp', 0.8),
        spawn('cinderRay', 0.5, 3, 125),
      ],
    },
    {
      atSec: 268,
      section: 18,
      spawns: [
        spawn('razorSwift', 0.15, 5, 70, 1.06),
        spawn('razorSwift', 0.85, 5, 70, 1.06),
        spawn('cinderRay', 0.35, 2, 118),
        spawn('cinderRay', 0.65, 2, 118),
        spawn('scoutFinch', 0.5, 6, 42),
      ],
    },
    { atSec: 290, section: 19, bannerKey: 'banner.finalboss', bossId: 'emberCrown', spawns: [] },
  ]),
};

export const STAGES: StageDef[] = [STAGE1, STAGE2];
