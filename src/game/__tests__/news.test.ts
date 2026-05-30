import { describe, it, expect } from 'vitest';
import { sampleNews, allNews } from '../news';
import { RNG } from '../rng';

describe('news.sampleNews', () => {
  it('returns at least one item for any round', () => {
    const out = sampleNews(new RNG('a'), 1, 8, [3, 5, 7], new Set());
    expect(out.length).toBeGreaterThanOrEqual(1);
  });

  it('round 1 picks only soft items', () => {
    for (let i = 0; i < 50; i++) {
      const out = sampleNews(new RNG(`r1-${i}`), 1, 8, [3, 5, 7], new Set());
      for (const item of out) {
        const mag = item.effects.reduce((a, e) => a + Math.abs(e.pct), 0);
        expect(mag).toBeLessThanOrEqual(0.06 + 1e-9);
      }
    }
  });

  it('insurance rounds bias toward punchy items', () => {
    let punchyCount = 0;
    const N = 50;
    for (let i = 0; i < N; i++) {
      const out = sampleNews(new RNG(`r3-${i}`), 3, 8, [3, 5, 7], new Set());
      const mag = Math.max(...out.flatMap((n) => n.effects.map((e) => Math.abs(e.pct))), 0);
      if (mag >= 0.06) punchyCount += 1;
    }
    expect(punchyCount).toBeGreaterThan(N * 0.5);
  });

  it('skips already-used items', () => {
    const used = new Set(allNews().slice(0, allNews().length - 1).map((n) => n.id));
    const out = sampleNews(new RNG('left'), 5, 8, [3, 5, 7], used);
    expect(out.length).toBeGreaterThan(0);
    for (const item of out) expect(used.has(item.id)).toBe(false);
  });
});
