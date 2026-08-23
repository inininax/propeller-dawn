export type GameCommand = 'up' | 'down' | 'left' | 'right' | 'fire' | 'bomb' | 'focus' | 'pause';

export type MenuCommand = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back';

const KEY_TO_COMMAND: Record<string, GameCommand> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  Space: 'fire',
  KeyX: 'bomb',
  ShiftLeft: 'bomb',
  ShiftRight: 'bomb',
  KeyZ: 'focus',
};

export const PAUSE_KEYS = new Set(['Escape', 'KeyP']);

export function keyToGameCommand(code: string): GameCommand | null {
  return KEY_TO_COMMAND[code] ?? null;
}

export function keyToPause(code: string): boolean {
  return PAUSE_KEYS.has(code);
}

const MENU_CONFIRM_KEYS = new Set(['Enter', 'Space', 'NumpadEnter']);

export function keyToMenuCommand(code: string): MenuCommand | null {
  if (code === 'ArrowUp') return 'up';
  if (code === 'ArrowDown') return 'down';
  if (code === 'ArrowLeft') return 'left';
  if (code === 'ArrowRight') return 'right';
  if (MENU_CONFIRM_KEYS.has(code)) return 'confirm';
  if (PAUSE_KEYS.has(code)) return 'back';
  return null;
}

export interface AnalogVector {
  x: number;
  y: number;
}

export function keyboardVector(active: ReadonlySet<GameCommand>): AnalogVector {
  let x = 0;
  let y = 0;
  if (active.has('left')) x -= 1;
  if (active.has('right')) x += 1;
  if (active.has('up')) y -= 1;
  if (active.has('down')) y += 1;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

export function applyFocusSpeed(baseSpeed: number, focusFactor: number, focused: boolean): number {
  return focused ? baseSpeed * focusFactor : baseSpeed;
}

export function relativeDragToVector(
  originX: number,
  originY: number,
  currentX: number,
  currentY: number,
  maxRadiusPx: number,
): AnalogVector {
  let dx = currentX - originX;
  let dy = currentY - originY;
  const len = Math.hypot(dx, dy);
  if (len <= 0) return { x: 0, y: 0 };
  if (len > maxRadiusPx) {
    dx = (dx / len) * maxRadiusPx;
    dy = (dy / len) * maxRadiusPx;
  }
  return { x: dx / maxRadiusPx, y: dy / maxRadiusPx };
}
