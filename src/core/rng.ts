export class SeededRandom {
  private state: number;

  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    this.state = this.seed === 0 ? 0x9e3779b9 : this.seed;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }

  fork(): SeededRandom {
    return new SeededRandom(Math.floor(this.next() * 0xffffffff) >>> 0);
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
