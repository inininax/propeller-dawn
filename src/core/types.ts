export type Language = 'ko' | 'en';
export type DifficultyId = 'easy' | 'normal' | 'hard';

export interface Vec2 {
  x: number;
  y: number;
}

export interface BulletSpawn {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: BulletKind;
  radius: number;
  damage?: number;
  splitAtMs?: number;
  splitCount?: number;
  splitSpeed?: number;
}

export type BulletKind = 'dot' | 'needle' | 'orb' | 'shard';

export interface PatternContext {
  x: number;
  y: number;
  aimAngleRad: number;
  timeMs: number;
  rng: SeededRandomLike;
}

export interface SeededRandomLike {
  next(): number;
  range(min: number, max: number): number;
}

export interface EnemyFireDef {
  patternId: string;
  intervalMs: number;
  delayMs: number;
  params?: Record<string, number>;
}

export interface EnemyDef {
  id: string;
  hp: number;
  score: number;
  width: number;
  height: number;
  hitRadius: number;
  elite: boolean;
  fire: EnemyFireDef[];
  move: MoveId;
  drop: ItemDropTable;
}

export type MoveId =
  | 'straightDown'
  | 'sineSwoop'
  | 'hookCurve'
  | 'hoverTop'
  | 'enterHoldLeave'
  | 'rearDash'
  | 'driftAim'
  | 'chargeDash'
  | 'cruise';

export interface ItemDropEntry {
  item: ItemKind;
  chance: number;
}

export interface ItemDropTable {
  entries: ItemDropEntry[];
  medalCount: number;
}

export type ItemKind = 'power' | 'bomb' | 'medal' | 'shield';

export interface WeaponShot {
  angleDeg: number;
  offsetX: number;
  offsetY: number;
  damage: number;
  pierce?: boolean;
}

export interface ShipWeaponLevel {
  intervalMs: number;
  shots: WeaponShot[];
}

export interface ShipDef {
  id: string;
  nameKey: string;
  descKey: string;
  speed: number;
  hitRadius: number;
  bombRadius: number;
  bombDamage: number;
  startBombsBonus: number;
  weapon: [ShipWeaponLevel, ShipWeaponLevel, ShipWeaponLevel];
}

export interface WaveSpawnAction {
  enemyId: string;
  count: number;
  xFrac: number;
  yFrac?: number;
  spacingPx?: number;
  moveOverride?: MoveId;
}

export interface WaveEvent {
  atSec: number;
  section: number;
  spawns: WaveSpawnAction[];
  bossId?: string;
  bannerKey?: string;
}

export interface StageDef {
  id: number;
  nameKey: string;
  subKey: string;
  theme: 'dawn' | 'ember';
  durationTargetSec: number;
  waves: WaveEvent[];
  midBossId?: string;
  finalBossId: string;
}
