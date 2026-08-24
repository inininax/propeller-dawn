import { describe, expect, it } from 'vitest';
import { mapPad, snapshotPad } from '@/systems/input/gamepad';

const noButtons = {
  left: false,
  right: false,
  up: false,
  down: false,
  a: false,
  b: false,
  x: false,
  y: false,
  l1: false,
  l2: false,
  r1: false,
  start: false,
};

describe('gamepad mapping', () => {
  it('deadzones small stick drift', () => {
    const st = mapPad({ lx: 0.1, ly: -0.15 }, noButtons);
    expect(st.mx).toBe(0);
    expect(st.my).toBe(0);
  });

  it('maps d-pad over stick and normalizes diagonals', () => {
    const dpad = mapPad({ lx: 0, ly: 0 }, { ...noButtons, left: true, up: true });
    expect(dpad.mx).toBeCloseTo(-Math.SQRT1_2);
    expect(dpad.my).toBeCloseTo(-Math.SQRT1_2);

    const stick = mapPad({ lx: -1, ly: -1 }, noButtons);
    expect(stick.mx).toBeCloseTo(-Math.SQRT1_2);
    expect(stick.my).toBeCloseTo(-Math.SQRT1_2);
  });

  it('fire on A or R1; bomb on B or L1; focus on X/L2; pause on Start', () => {
    expect(mapPad({ lx: 0, ly: 0 }, { ...noButtons, a: true }).fire).toBe(true);
    expect(mapPad({ lx: 0, ly: 0 }, { ...noButtons, r1: true }).fire).toBe(true);
    expect(mapPad({ lx: 0, ly: 0 }, { ...noButtons, b: true }).bomb).toBe(true);
    expect(mapPad({ lx: 0, ly: 0 }, { ...noButtons, l1: true }).bomb).toBe(true);
    const focus = mapPad({ lx: 0, ly: 0 }, { ...noButtons, x: true });
    expect(focus.focus).toBe(true);
    expect(focus.fire).toBe(false);
    expect(mapPad({ lx: 0, ly: 0 }, { ...noButtons, l2: true }).focus).toBe(true);
    expect(mapPad({ lx: 0, ly: 0 }, { ...noButtons, start: true }).pause).toBe(true);
  });

  it('snapshotPad reads axes defensively when absent', () => {
    const snap = snapshotPad({
      axes: [],
      left: false,
      right: true,
      up: false,
      down: false,
      a: false,
      b: false,
      x: false,
      y: false,
      l1: false,
      l2: false,
      r1: false,
      start: false,
    });
    const st = mapPad(snap.axes, snap.btn);
    expect(st.mx).toBe(1);
    expect(st.my).toBe(0);
  });
});
