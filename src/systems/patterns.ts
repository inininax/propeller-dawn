import type { BulletSpawn, PatternContext } from '../core/types';

export type PatternGenerator = (
  ctx: PatternContext,
  params: Record<string, number>,
) => BulletSpawn[];

const DEG = Math.PI / 180;

function make(
  x: number,
  y: number,
  angleRad: number,
  speed: number,
  kind: BulletSpawn['kind'],
  radius: number,
  extra?: Partial<BulletSpawn>,
): BulletSpawn {
  return {
    x,
    y,
    vx: Math.cos(angleRad) * speed,
    vy: Math.sin(angleRad) * speed,
    kind,
    radius,
    ...extra,
  };
}

export const PATTERNS: Record<string, PatternGenerator> = {
  aimed(ctx, p) {
    const count = Math.max(1, Math.round(p.count ?? 1));
    const spreadDeg = p.spreadDeg ?? 0;
    const speed = p.speed ?? 160;
    const radius = p.radius ?? 6;
    const kind = (p.kind as number | undefined) ?? 0;
    const out: BulletSpawn[] = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const angle = ctx.aimAngleRad + t * spreadDeg * DEG;
      out.push(make(ctx.x, ctx.y, angle, speed, kindToBulletKind(kind), radius));
    }
    return out;
  },

  ring(ctx, p) {
    const count = Math.max(3, Math.round(p.count ?? 12));
    const speed = p.speed ?? 130;
    const phaseDeg = p.phaseDeg ?? 0;
    const spinDeg = p.spinDeg ?? 0;
    const radius = p.radius ?? 6;
    const phase = (phaseDeg + spinDeg * (ctx.timeMs / 1000)) * DEG;
    const out: BulletSpawn[] = [];
    for (let i = 0; i < count; i++) {
      const angle = phase + (i / count) * Math.PI * 2;
      out.push(make(ctx.x, ctx.y, angle, speed, 'dot', radius));
    }
    return out;
  },

  fanBurst(ctx, p) {
    const count = Math.max(2, Math.round(p.count ?? 5));
    const spreadDeg = p.spreadDeg ?? 60;
    const speed = p.speed ?? 150;
    const wobbleDeg = p.wobbleDeg ?? 0;
    const radius = p.radius ?? 7;
    const base = ctx.aimAngleRad + ctx.rng.range(-wobbleDeg, wobbleDeg) * DEG;
    const out: BulletSpawn[] = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      out.push(make(ctx.x, ctx.y, base + t * spreadDeg * DEG, speed, 'shard', radius));
    }
    return out;
  },

  spiralBurst(ctx, p) {
    const arms = Math.max(1, Math.round(p.arms ?? 3));
    const speed = p.speed ?? 120;
    const rotatePerShotDeg = p.rotatePerShotDeg ?? 31;
    const shotsPerArm = Math.round(p.shotsPerArm ?? 1);
    const radius = p.radius ?? 6;
    const offset = rotatePerShotDeg * (ctx.timeMs / 16.6667);
    const out: BulletSpawn[] = [];
    for (let arm = 0; arm < arms; arm++) {
      for (let s = 0; s < shotsPerArm; s++) {
        const angle = (arm / arms) * Math.PI * 2 + (offset + s * rotatePerShotDeg * 0.35) * DEG;
        out.push(make(ctx.x, ctx.y, angle, speed, 'orb', radius));
      }
    }
    return out;
  },

  wallWithGap(ctx, p) {
    const fieldWidth = p.fieldWidth ?? 540;
    const gapCenterFrac = p.gapXFrac ?? 0.5;
    const gapWidth = p.gapWidthPx ?? 90;
    const spacing = p.spacingPx ?? 46;
    const speed = p.speed ?? 140;
    const radius = p.radius ?? 6;
    const gapCenter = clamp(gapCenterFrac, 0.08, 0.92) * fieldWidth;
    const out: BulletSpawn[] = [];
    for (let x = spacing / 2; x < fieldWidth; x += spacing) {
      if (Math.abs(x - gapCenter) <= gapWidth / 2) continue;
      out.push(make(x, ctx.y, Math.PI / 2, speed, 'needle', radius));
    }
    return out;
  },

  splitOrb(ctx, p) {
    const speed = p.speed ?? 90;
    const splitSpeed = p.splitSpeed ?? 190;
    const splitCount = Math.max(4, Math.round(p.splitCount ?? 8));
    const delay = p.delayMs ?? 900;
    const angle = p.angleDeg !== undefined ? p.angleDeg * DEG : ctx.aimAngleRad;
    return [
      make(ctx.x, ctx.y, angle, speed, 'orb', 9, {
        splitAtMs: delay,
        splitCount,
        splitSpeed,
      }),
    ];
  },
};

function kindToBulletKind(code: number): BulletSpawn['kind'] {
  switch (code) {
    case 1:
      return 'needle';
    case 2:
      return 'orb';
    case 3:
      return 'shard';
    default:
      return 'dot';
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function generateSplit(spawn: BulletSpawn): BulletSpawn[] {
  const count = spawn.splitCount ?? 8;
  const speed = spawn.splitSpeed ?? 190;
  const out: BulletSpawn[] = [];
  const baseAngle = Math.atan2(spawn.vy, spawn.vx);
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i / count) * Math.PI * 2;
    out.push(make(spawn.x, spawn.y, angle, speed, 'shard', 5));
  }
  return out;
}
