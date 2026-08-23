import type { ShipDef } from '../core/types';

export const SHIPS: ShipDef[] = [
  {
    id: 'lark',
    nameKey: 'ship.lark.name',
    descKey: 'ship.lark.desc',
    speed: 280,
    hitRadius: 6,
    bombRadius: 190,
    bombDamage: 24,
    startBombsBonus: 0,
    weapon: [
      {
        intervalMs: 110,
        shots: [
          { angleDeg: 0, offsetX: -10, offsetY: -14, damage: 5 },
          { angleDeg: 0, offsetX: 10, offsetY: -14, damage: 5 },
        ],
      },
      {
        intervalMs: 105,
        shots: [
          { angleDeg: 0, offsetX: -12, offsetY: -16, damage: 6 },
          { angleDeg: 0, offsetX: 12, offsetY: -16, damage: 6 },
          { angleDeg: -8, offsetX: -18, offsetY: -8, damage: 4 },
          { angleDeg: 8, offsetX: 18, offsetY: -8, damage: 4 },
        ],
      },
      {
        intervalMs: 100,
        shots: [
          { angleDeg: 0, offsetX: -12, offsetY: -16, damage: 7 },
          { angleDeg: 0, offsetX: 12, offsetY: -16, damage: 7 },
          { angleDeg: -10, offsetX: -20, offsetY: -6, damage: 5 },
          { angleDeg: 10, offsetX: 20, offsetY: -6, damage: 5 },
          { angleDeg: -20, offsetX: -24, offsetY: 0, damage: 4 },
          { angleDeg: 20, offsetX: 24, offsetY: 0, damage: 4 },
        ],
      },
    ],
  },
  {
    id: 'kite',
    nameKey: 'ship.kite.name',
    descKey: 'ship.kite.desc',
    speed: 345,
    hitRadius: 5,
    bombRadius: 150,
    bombDamage: 20,
    startBombsBonus: 0,
    weapon: [
      {
        intervalMs: 80,
        shots: [{ angleDeg: 0, offsetX: 0, offsetY: -18, damage: 9 }],
      },
      {
        intervalMs: 75,
        shots: [
          { angleDeg: 0, offsetX: 0, offsetY: -18, damage: 11, pierce: true },
          { angleDeg: -2, offsetX: -7, offsetY: -12, damage: 5 },
          { angleDeg: 2, offsetX: 7, offsetY: -12, damage: 5 },
        ],
      },
      {
        intervalMs: 70,
        shots: [
          { angleDeg: 0, offsetX: 0, offsetY: -20, damage: 13, pierce: true },
          { angleDeg: -3, offsetX: -8, offsetY: -14, damage: 7 },
          { angleDeg: 3, offsetX: 8, offsetY: -14, damage: 7 },
          { angleDeg: -6, offsetX: -12, offsetY: -8, damage: 6 },
          { angleDeg: 6, offsetX: 12, offsetY: -8, damage: 6 },
        ],
      },
    ],
  },
  {
    id: 'rook',
    nameKey: 'ship.rook.name',
    descKey: 'ship.rook.desc',
    speed: 225,
    hitRadius: 7,
    bombRadius: 270,
    bombDamage: 30,
    startBombsBonus: 1,
    weapon: [
      {
        intervalMs: 130,
        shots: [
          { angleDeg: -14, offsetX: -12, offsetY: -10, damage: 5 },
          { angleDeg: 0, offsetX: 0, offsetY: -16, damage: 6 },
          { angleDeg: 14, offsetX: 12, offsetY: -10, damage: 5 },
        ],
      },
      {
        intervalMs: 125,
        shots: [
          { angleDeg: -22, offsetX: -16, offsetY: -6, damage: 5 },
          { angleDeg: -11, offsetX: -9, offsetY: -12, damage: 5 },
          { angleDeg: 0, offsetX: 0, offsetY: -16, damage: 6 },
          { angleDeg: 11, offsetX: 9, offsetY: -12, damage: 5 },
          { angleDeg: 22, offsetX: 16, offsetY: -6, damage: 5 },
        ],
      },
      {
        intervalMs: 120,
        shots: [
          { angleDeg: -30, offsetX: -20, offsetY: -2, damage: 5 },
          { angleDeg: -20, offsetX: -14, offsetY: -8, damage: 5 },
          { angleDeg: -10, offsetX: -8, offsetY: -14, damage: 5 },
          { angleDeg: 0, offsetX: 0, offsetY: -16, damage: 7 },
          { angleDeg: 10, offsetX: 8, offsetY: -14, damage: 5 },
          { angleDeg: 20, offsetX: 14, offsetY: -8, damage: 5 },
          { angleDeg: 30, offsetX: 20, offsetY: -2, damage: 5 },
        ],
      },
    ],
  },
];

export function getShip(id: string): ShipDef {
  const ship = SHIPS.find((s) => s.id === id);
  if (!ship) throw new Error(`Unknown ship id: ${id}`);
  return ship;
}

export function shipUnlockStage(id: string): number {
  if (id === 'kite') return 1;
  if (id === 'rook') return 2;
  return 0;
}

export function isShipUnlocked(id: string, stagesCleared: number): boolean {
  return stagesCleared >= shipUnlockStage(id);
}
