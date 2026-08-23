import type { DifficultyId } from '../core/types';

export interface DifficultyDef {
  id: DifficultyId;
  nameKey: string;
  enemySpeedMult: number;
  fireIntervalMult: number;
  bulletSpeedMult: number;
  bossHpMult: number;
  playerLives: number;
  startBombs: number;
  scoreMult: number;
  continueLimit: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyDef> = {
  easy: {
    id: 'easy',
    nameKey: 'difficulty.easy',
    enemySpeedMult: 0.85,
    fireIntervalMult: 1.25,
    bulletSpeedMult: 0.85,
    bossHpMult: 0.8,
    playerLives: 4,
    startBombs: 3,
    scoreMult: 0.7,
    continueLimit: 99,
  },
  normal: {
    id: 'normal',
    nameKey: 'difficulty.normal',
    enemySpeedMult: 1,
    fireIntervalMult: 1,
    bulletSpeedMult: 1,
    bossHpMult: 1,
    playerLives: 3,
    startBombs: 3,
    scoreMult: 1,
    continueLimit: 3,
  },
  hard: {
    id: 'hard',
    nameKey: 'difficulty.hard',
    enemySpeedMult: 1.15,
    fireIntervalMult: 0.8,
    bulletSpeedMult: 1.18,
    bossHpMult: 1.3,
    playerLives: 2,
    startBombs: 2,
    scoreMult: 1.5,
    continueLimit: 1,
  },
};

export const DIFFICULTY_ORDER: DifficultyId[] = ['easy', 'normal', 'hard'];
