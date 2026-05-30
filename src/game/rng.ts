// Mulberry32 — small, fast, deterministic PRNG. Plenty good for a party game.

export class RNG {
  private state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
    if (this.state === 0) this.state = 0x9e3779b9;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform in [-1, 1]. */
  centered(): number {
    return this.next() * 2 - 1;
  }

  /** Pseudo-gaussian-ish: average of two uniforms, then re-centered. */
  gauss(): number {
    return (this.next() + this.next()) - 1;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  weightedPick<T>(items: readonly T[], weight: (t: T) => number): T {
    const total = items.reduce((a, b) => a + Math.max(0, weight(b)), 0);
    if (total <= 0) return this.pick(items);
    let r = this.next() * total;
    for (const item of items) {
      r -= Math.max(0, weight(item));
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
