export interface ScoreConfig {
  comboWindowMs: number;
  multStepCombo: number;
  multStepValue: number;
  maxMultiplier: number;
}

export interface ScoreState {
  score: number;
  combo: number;
  bestCombo: number;
  multiplier: number;
  grazeCount: number;
  itemChain: number;
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  comboWindowMs: 2000,
  multStepCombo: 10,
  multStepValue: 0.5,
  maxMultiplier: 8,
};

export function createScoreState(): ScoreState {
  return {
    score: 0,
    combo: 0,
    bestCombo: 0,
    multiplier: 1,
    grazeCount: 0,
    itemChain: 0,
  };
}

function multiplierForCombo(combo: number, cfg: ScoreConfig): number {
  if (combo <= 0) return 1;
  const steps = Math.floor(combo / cfg.multStepCombo);
  return Math.min(cfg.maxMultiplier, 1 + steps * cfg.multStepValue);
}

export function registerKill(
  state: ScoreState,
  basePoints: number,
  nowMs: number,
  cfg: ScoreConfig = DEFAULT_SCORE_CONFIG,
): number {
  if (state.combo > 0 && nowMs - lastKillAt(state) > cfg.comboWindowMs) {
    state.combo = 0;
  }
  state.combo += 1;
  setLastKillAt(state, nowMs);
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.multiplier = multiplierForCombo(state.combo, cfg);
  const gained = Math.round(basePoints * state.multiplier);
  state.score += gained;
  return gained;
}

const LAST_KILL_KEY = '__lastKillAt';

function lastKillAt(state: ScoreState): number {
  const v = (state as unknown as Record<string, number>)[LAST_KILL_KEY];
  return typeof v === 'number' ? v : -Infinity;
}

function setLastKillAt(state: ScoreState, nowMs: number): void {
  (state as unknown as Record<string, number>)[LAST_KILL_KEY] = nowMs;
}

export function tickScore(
  state: ScoreState,
  nowMs: number,
  cfg: ScoreConfig = DEFAULT_SCORE_CONFIG,
): void {
  if (state.combo > 0 && nowMs - lastKillAt(state) > cfg.comboWindowMs) {
    state.combo = 0;
    state.multiplier = 1;
  }
  if (state.itemChain > 0 && nowMs - lastItemAt(state) > ITEM_CHAIN_WINDOW_FALLBACK) {
    state.itemChain = 0;
  }
}

export function registerGraze(state: ScoreState, points = 100): void {
  state.grazeCount += 1;
  state.score += points;
}

const ITEM_CHAIN_WINDOW_FALLBACK = 3000;

const LAST_ITEM_KEY = '__lastItemAt';

export function registerItemPickup(
  state: ScoreState,
  medalBaseValue: number,
  nowMs: number,
  windowMs = ITEM_CHAIN_WINDOW_FALLBACK,
): { valueGained: number; chain: number } {
  if (state.itemChain > 0 && nowMs - lastItemAt(state) > windowMs) {
    state.itemChain = 0;
  }
  setLastItemAt(state, nowMs);
  state.itemChain += 1;
  const chainMult = Math.min(10, state.itemChain);
  const gained = Math.round(medalBaseValue * chainMult);
  state.score += gained;
  return { valueGained: gained, chain: chainMult };
}

function lastItemAt(state: ScoreState): number {
  const v = (state as unknown as Record<string, number>)[LAST_ITEM_KEY];
  return typeof v === 'number' ? v : -Infinity;
}

function setLastItemAt(state: ScoreState, nowMs: number): void {
  (state as unknown as Record<string, number>)[LAST_ITEM_KEY] = nowMs;
}

export interface StageBonusInput {
  livesLeft: number;
  bombsLeft: number;
  difficultyMult: number;
  lifeValue?: number;
  bombValue?: number;
}

export function stageClearBonus(input: StageBonusInput): number {
  const lifeValue = input.lifeValue ?? 10000;
  const bombValue = input.bombValue ?? 5000;
  return Math.round(
    (input.livesLeft * lifeValue + input.bombsLeft * bombValue) * input.difficultyMult,
  );
}

export function formatScore(score: number): string {
  return score.toLocaleString('en-US');
}
