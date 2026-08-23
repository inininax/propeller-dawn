export class MenuKeyFilter {
  private lastAt = new Map<string, number>();

  constructor(private readonly cooldownMs = 180) {}

  accept(id: string, nowMs: number): boolean {
    const last = this.lastAt.get(id);
    if (last !== undefined && nowMs - last < this.cooldownMs) {
      return false;
    }
    this.lastAt.set(id, nowMs);
    return true;
  }

  clear(): void {
    this.lastAt.clear();
  }
}
