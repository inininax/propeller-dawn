export interface PadButtonSnapshot {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  l1: boolean;
  l2: boolean;
  r1: boolean;
  start: boolean;
}

export interface PadAxisSnapshot {
  lx: number;
  ly: number;
}

export interface PadInputState {
  mx: number;
  my: number;
  fire: boolean;
  bomb: boolean;
  focus: boolean;
  pause: boolean;
}

const STICK_DEADZONE = 0.24;

function deadzone(v: number): number {
  if (Math.abs(v) < STICK_DEADZONE) return 0;
  return v < -1 ? -1 : v > 1 ? 1 : v;
}

export function mapPad(axes: PadAxisSnapshot, btn: PadButtonSnapshot): PadInputState {
  let mx = deadzone(axes.lx);
  let my = deadzone(axes.ly);
  if (btn.left) mx = -1;
  if (btn.right) mx = 1;
  if (btn.up) my = -1;
  if (btn.down) my = 1;
  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }
  return {
    mx,
    my,
    fire: btn.a || btn.r1,
    bomb: btn.b || btn.l1,
    focus: btn.x || btn.l2,
    pause: btn.start,
  };
}

export interface PhaserLikePad {
  axes: Array<{ getValue(): number }>;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  l1: boolean;
  l2: boolean;
  r1: boolean;
  start: boolean;
}

export function snapshotPad(pad: PhaserLikePad): { axes: PadAxisSnapshot; btn: PadButtonSnapshot } {
  return {
    axes: {
      lx: pad.axes[0] ? pad.axes[0].getValue() : 0,
      ly: pad.axes[1] ? pad.axes[1].getValue() : 0,
    },
    btn: {
      left: pad.left,
      right: pad.right,
      up: pad.up,
      down: pad.down,
      a: pad.a,
      b: pad.b,
      x: pad.x,
      y: pad.y,
      l1: pad.l1,
      l2: pad.l2,
      r1: pad.r1,
      start: pad.start,
    },
  };
}
