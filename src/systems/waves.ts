import type { WaveEvent } from '../core/types';

export interface DueEvent {
  event: WaveEvent;
}

export class WaveRunner {
  private elapsedMs = 0;

  private index = 0;

  constructor(private readonly waves: readonly WaveEvent[]) {}

  get progress(): number {
    const last = this.waves[this.waves.length - 1];
    if (!last) return 1;
    return Math.min(1, this.elapsedMs / (last.atSec * 1000));
  }

  get finished(): boolean {
    return this.index >= this.waves.length;
  }

  get nextEvent(): WaveEvent | undefined {
    return this.waves[this.index];
  }

  skipTo(targetMs: number): void {
    if (targetMs > this.elapsedMs) {
      this.elapsedMs = targetMs;
    }
  }

  update(dtMs: number): WaveEvent[] {
    this.elapsedMs += dtMs;
    const due: WaveEvent[] = [];
    while (!this.finished) {
      const next = this.waves[this.index];
      if (next.atSec * 1000 > this.elapsedMs) break;
      due.push(next);
      this.index += 1;
    }
    return due;
  }
}

export function sortWaves(waves: WaveEvent[]): WaveEvent[] {
  return [...waves].sort((a, b) => a.atSec - b.atSec || a.section - b.section);
}
