import type { EnemyDef, MoveId } from '../core/types';

export type MoveFunction = (
  t: number,
  startX: number,
  startY: number,
) => { x: number; y: number; angleRad: number; done: boolean };

const DOWN = Math.PI / 2;

function straightDown(t: number, sx: number, sy: number) {
  const y = sy + 170 * t;
  return { x: sx, y, angleRad: DOWN, done: y > 1100 };
}

function sineSwoop(t: number, sx: number, sy: number) {
  const y = sy + 150 * t;
  const x = sx + Math.sin(t * 2.4 + sx * 0.01) * 90;
  return { x, y, angleRad: DOWN + Math.cos(t * 2.4 + sx * 0.01) * 0.5, done: y > 1100 };
}

function hookCurve(t: number, sx: number, sy: number) {
  const dir = sx < 270 ? 1 : -1;
  const x = sx + dir * 150 * Math.sin(Math.min(t * 1.6, Math.PI));
  const y = sy + 95 * t - 40 * Math.sin(Math.min(t * 1.6, Math.PI));
  return {
    x,
    y,
    angleRad: DOWN + dir * Math.cos(Math.min(t * 1.6, Math.PI)) * 0.8,
    done: y > 1100 || t > 12,
  };
}

function hoverTop(t: number, sx: number, sy: number) {
  if (t < 1.6) {
    return { x: sx, y: sy + 130 * t, angleRad: DOWN, done: false };
  }
  if (t > 9) {
    const u = t - 9;
    const y = sy + 208 + 60 * u;
    return { x: sx, y, angleRad: DOWN, done: y > 1100 };
  }
  return {
    x: sx + Math.sin((t - 1.6) * 1.1) * 70,
    y: sy + 208 + Math.sin((t - 1.6) * 0.7) * 10,
    angleRad: DOWN,
    done: false,
  };
}

function enterHoldLeave(t: number, sx: number, sy: number) {
  const targetY = sy + 240;
  if (t < 1.5) return { x: sx, y: sy + 160 * t, angleRad: DOWN, done: false };
  if (t < 7.5) {
    const holdT = t - 1.5;
    return {
      x: sx + Math.sin(holdT * 1.3) * 110,
      y: targetY,
      angleRad: DOWN,
      done: false,
    };
  }
  const leaveT = t - 7.5;
  return { x: sx, y: targetY + 220 * leaveT, angleRad: DOWN, done: targetY + 220 * leaveT > 1100 };
}

function rearDash(t: number, sx: number, sy: number) {
  const entryY = Math.max(sy, 1010);
  if (t < 1.0) {
    const y = entryY - 300 * t;
    return { x: sx, y, angleRad: -DOWN, done: false };
  }
  if (t < 3.4) {
    const u = t - 1.0;
    return {
      x: sx + Math.sin(u * 2.2) * 64,
      y: entryY - 300 + Math.sin(u * 1.4) * 44,
      angleRad: -DOWN,
      done: false,
    };
  }
  if (t < 4.6) return { x: sx, y: entryY - 300, angleRad: -DOWN, done: false };
  const u = t - 4.6;
  return {
    x: sx + 150 * u,
    y: entryY - 300 - 240 * u,
    angleRad: -Math.PI / 4,
    done: u > 3.5,
  };
}

function driftAim(t: number, sx: number, sy: number) {
  if (t < 2.0) {
    return { x: sx, y: sy + 100 * t, angleRad: DOWN, done: false };
  }
  if (t < 8.0) {
    const u = t - 2.0;
    return {
      x: sx + Math.sin(u * 0.9) * 130,
      y: sy + 200 + Math.sin(u * 0.6) * 24,
      angleRad: DOWN,
      done: false,
    };
  }
  const u = t - 8.0;
  return { x: sx, y: sy + 200 + 180 * u, angleRad: DOWN, done: u > 4 };
}

function chargeDash(t: number, sx: number, sy: number) {
  if (t < 1.4) {
    return { x: sx + Math.sin(t * 9) * 14, y: sy + 60 * t, angleRad: DOWN, done: false };
  }
  if (t < 2.6) return { x: sx, y: sy + 84, angleRad: DOWN, done: false };
  const u = t - 2.6;
  const speed = 420;
  return { x: sx, y: sy + 84 + speed * u, angleRad: DOWN, done: sy + 84 + speed * u > 1100 };
}

function cruise(t: number, sx: number, sy: number) {
  const x = sx + 46 * t;
  const y = sy + 26 * Math.sin(t * 0.8);
  return { x, y, angleRad: DOWN, done: x > 700 || t > 16 };
}

export const MOVES: Record<MoveId, MoveFunction> = {
  straightDown,
  sineSwoop,
  hookCurve,
  hoverTop,
  enterHoldLeave,
  rearDash,
  driftAim,
  chargeDash,
  cruise,
};

function def(partial: Omit<EnemyDef, 'elite'> & { elite?: boolean }): EnemyDef {
  return { elite: false, ...partial };
}

export const ENEMIES: Record<string, EnemyDef> = {
  scoutFinch: def({
    id: 'scoutFinch',
    hp: 8,
    score: 300,
    width: 34,
    height: 34,
    hitRadius: 15,
    fire: [
      {
        patternId: 'aimed',
        intervalMs: 1500,
        delayMs: 600,
        params: { count: 1, speed: 190 },
      },
    ],
    move: 'straightDown',
    drop: { entries: [{ item: 'medal', chance: 0.25 }], medalCount: 1 },
  }),

  hookInterceptor: def({
    id: 'hookInterceptor',
    hp: 16,
    score: 500,
    width: 38,
    height: 38,
    hitRadius: 17,
    fire: [
      {
        patternId: 'aimed',
        intervalMs: 1300,
        delayMs: 800,
        params: { count: 3, spreadDeg: 18, speed: 210, kind: 1 },
      },
    ],
    move: 'hookCurve',
    drop: {
      entries: [
        { item: 'power', chance: 0.08 },
        { item: 'medal', chance: 0.4 },
      ],
      medalCount: 1,
    },
  }),

  morrowBomber: def({
    id: 'morrowBomber',
    hp: 34,
    score: 900,
    width: 58,
    height: 44,
    hitRadius: 24,
    fire: [
      {
        patternId: 'fanBurst',
        intervalMs: 2100,
        delayMs: 1200,
        params: { count: 5, spreadDeg: 70, speed: 150, radius: 7 },
      },
    ],
    move: 'hoverTop',
    drop: {
      entries: [
        { item: 'bomb', chance: 0.07 },
        { item: 'medal', chance: 0.6 },
      ],
      medalCount: 2,
    },
  }),

  cradleCarrier: def({
    id: 'cradleCarrier',
    hp: 60,
    score: 1500,
    width: 72,
    height: 64,
    hitRadius: 30,
    fire: [],
    move: 'enterHoldLeave',
    drop: { entries: [{ item: 'power', chance: 1 }], medalCount: 2 },
  }),

  aegisKite: def({
    id: 'aegisKite',
    hp: 90,
    score: 3000,
    width: 52,
    height: 52,
    hitRadius: 22,
    elite: true,
    fire: [
      {
        patternId: 'ring',
        intervalMs: 2600,
        delayMs: 1000,
        params: { count: 14, speed: 140, spinDeg: 22 },
      },
      {
        patternId: 'aimed',
        intervalMs: 1700,
        delayMs: 1600,
        params: { count: 3, spreadDeg: 12, speed: 230, kind: 1 },
      },
    ],
    move: 'driftAim',
    drop: { entries: [{ item: 'shield', chance: 1 }], medalCount: 3 },
  }),

  razorSwift: def({
    id: 'razorSwift',
    hp: 10,
    score: 400,
    width: 32,
    height: 36,
    hitRadius: 14,
    fire: [
      {
        patternId: 'aimed',
        intervalMs: 1200,
        delayMs: 400,
        params: { count: 1, speed: 240, kind: 3 },
      },
    ],
    move: 'rearDash',
    drop: { entries: [{ item: 'medal', chance: 0.35 }], medalCount: 1 },
  }),

  cinderRay: def({
    id: 'cinderRay',
    hp: 26,
    score: 800,
    width: 44,
    height: 40,
    hitRadius: 19,
    fire: [
      {
        patternId: 'splitOrb',
        intervalMs: 2800,
        delayMs: 900,
        params: { speed: 95, splitSpeed: 185, splitCount: 8, delayMs: 850 },
      },
    ],
    move: 'sineSwoop',
    drop: {
      entries: [
        { item: 'power', chance: 0.1 },
        { item: 'medal', chance: 0.45 },
      ],
      medalCount: 1,
    },
  }),

  beaconWasp: def({
    id: 'beaconWasp',
    hp: 30,
    score: 1000,
    width: 40,
    height: 42,
    hitRadius: 17,
    fire: [],
    move: 'hoverTop',
    drop: {
      entries: [
        { item: 'bomb', chance: 0.09 },
        { item: 'medal', chance: 0.5 },
      ],
      medalCount: 2,
    },
  }),

  vulcanRook: def({
    id: 'vulcanRook',
    hp: 130,
    score: 4500,
    width: 56,
    height: 56,
    hitRadius: 23,
    elite: true,
    fire: [
      {
        patternId: 'fanBurst',
        intervalMs: 1900,
        delayMs: 1100,
        params: { count: 7, spreadDeg: 85, speed: 165, wobbleDeg: 6 },
      },
      {
        patternId: 'aimed',
        intervalMs: 3400,
        delayMs: 2400,
        params: { count: 1, speed: 320, kind: 2, radius: 8 },
      },
    ],
    move: 'chargeDash',
    drop: { entries: [{ item: 'shield', chance: 1 }], medalCount: 3 },
  }),

  bulwarkCruiser: def({
    id: 'bulwarkCruiser',
    hp: 220,
    score: 6000,
    width: 96,
    height: 88,
    hitRadius: 40,
    elite: true,
    fire: [
      {
        patternId: 'aimed',
        intervalMs: 1500,
        delayMs: 1400,
        params: { count: 5, spreadDeg: 34, speed: 200, kind: 1 },
      },
      {
        patternId: 'ring',
        intervalMs: 3300,
        delayMs: 2600,
        params: { count: 18, speed: 135, spinDeg: -14 },
      },
    ],
    move: 'cruise',
    drop: { entries: [{ item: 'power', chance: 1 }], medalCount: 4 },
  }),
};
