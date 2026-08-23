import type { DifficultyId } from '../core/types';

export interface RunState {
  shipId: string;
  difficulty: DifficultyId;
  stageIndex: number;
  lives: number;
  bombs: number;
  power: number;
  hasShield: boolean;
  score: number;
  continuesUsed: number;
  seed: number;
}

export interface BriefingData {
  run: RunState;
  freshStage?: boolean;
}

export interface StageClearResult {
  livesBonus: number;
  bombsBonus: number;
  flightBonus: number;
  totalBonus: number;
  isFinalStage: boolean;
}

export interface ResultData {
  won: boolean;
  run: RunState;
  grazeCount: number;
  maxCombo: number;
  newRecord: boolean;
}
