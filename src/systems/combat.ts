export interface Circle {
  x: number;
  y: number;
  r: number;
}

export function circlesOverlap(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const rr = a.r + b.r;
  return dx * dx + dy * dy <= rr * rr;
}

export function circleDistanceSq(a: Circle, b: Circle): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export interface Damageable {
  hp: number;
}

export function applyDamage(target: Damageable, amount: number): number {
  const dealt = Math.max(0, Math.min(amount, target.hp));
  target.hp -= dealt;
  return dealt;
}

export interface InvulnerabilityState {
  invulnMsRemaining: number;
}

export const PLAYER_HIT_INVULN_MS = 0;

export function canTakeDamage(state: InvulnerabilityState, deltaMs: number): boolean {
  if (state.invulnMsRemaining > 0) {
    state.invulnMsRemaining = Math.max(0, state.invulnMsRemaining - deltaMs);
    if (state.invulnMsRemaining > 0) return false;
  }
  return true;
}

export function grantInvulnerability(state: InvulnerabilityState, durationMs: number): void {
  state.invulnMsRemaining = Math.max(state.invulnMsRemaining, durationMs);
}
