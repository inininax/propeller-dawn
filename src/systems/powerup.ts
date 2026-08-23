export const MIN_POWER = 1;
export const MAX_POWER = 3;

export function clampPower(power: number): number {
  return Math.min(MAX_POWER, Math.max(MIN_POWER, Math.round(power)));
}

export interface PowerUpResult {
  power: number;
  maxedOut: boolean;
}

export function addPower(current: number, amount: number): PowerUpResult {
  const next = clampPower(current + amount);
  return { power: next, maxedOut: next === MAX_POWER && current >= MAX_POWER };
}

export function applyDeathPenalty(current: number, penaltyLevels = 1): number {
  const next = clampPower(current - penaltyLevels);
  return next;
}

export function shieldState(hasShield: boolean): boolean {
  return hasShield;
}
