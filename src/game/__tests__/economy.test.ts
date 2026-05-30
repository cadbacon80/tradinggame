import { describe, it, expect } from 'vitest';
import { makeConfig } from '../config';
import { updateMarket, initialPrices } from '../economy';
import { RNG } from '../rng';
import type { NewsItem } from '../types';

describe('economy.updateMarket', () => {
  it('returns integer prices', () => {
    const config = makeConfig('seed-a');
    const prev = initialPrices(config);
    const update = updateMarket(config, prev, config.insurance.startPrice, [], new RNG('r1'));
    for (const t of config.tickers) {
      expect(Number.isInteger(update.prices[t.id])).toBe(true);
      expect(update.prices[t.id]).toBeGreaterThan(0);
    }
    expect(Number.isInteger(update.insurancePrice)).toBe(true);
  });

  it('positive news effect raises the targeted ticker price', () => {
    const config = makeConfig('seed-b');
    const prev = initialPrices(config);
    const news: NewsItem[] = [{
      id: 'boost-fzzl',
      headline: 'BYTE doubles',
      emoji: '🚀',
      effects: [{ target: { ticker: 'BYTE' }, pct: 0.20 }],
    }];
    // Use a noise-free RNG (we accept noise but average across runs).
    let positive = 0;
    for (let i = 0; i < 50; i++) {
      const update = updateMarket(config, prev, 25, news, new RNG(`r-${i}`));
      if (update.prices['BYTE']! > prev['BYTE']!) positive += 1;
    }
    expect(positive).toBeGreaterThanOrEqual(45);
  });

  it('market crash pumps insurance', () => {
    const config = makeConfig('seed-c');
    const prev = initialPrices(config);
    const news: NewsItem[] = [{
      id: 'crash',
      headline: 'crash',
      emoji: '💥',
      effects: [{ target: 'market', pct: -0.06 }],
    }];
    let ups = 0;
    for (let i = 0; i < 50; i++) {
      const update = updateMarket(config, prev, 25, news, new RNG(`crash-${i}`));
      if (update.insurancePrice > 25) ups += 1;
    }
    expect(ups).toBeGreaterThanOrEqual(45);
  });

  it('flat market bleeds insurance below baseline magnitude', () => {
    const config = makeConfig('seed-d');
    const prev = initialPrices(config);
    let downs = 0;
    for (let i = 0; i < 50; i++) {
      const update = updateMarket(config, prev, 25, [], new RNG(`flat-${i}`));
      if (update.insurancePrice <= 25) downs += 1;
    }
    expect(downs).toBeGreaterThan(25);
  });

  it('big rally also pumps insurance (magnitude model)', () => {
    const config = makeConfig('seed-rally');
    const prev = initialPrices(config);
    const news: NewsItem[] = [{
      id: 'rally',
      headline: 'rally',
      emoji: '🚀',
      effects: [{ target: 'market', pct: 0.06 }],
    }];
    let ups = 0;
    for (let i = 0; i < 50; i++) {
      const update = updateMarket(config, prev, 25, news, new RNG(`rally-${i}`));
      if (update.insurancePrice > 25) ups += 1;
    }
    expect(ups).toBeGreaterThan(35);
  });

  it('caps a single ticker effect at the per-round limit', () => {
    const config = makeConfig('seed-e');
    const prev = initialPrices(config);
    const huge: NewsItem[] = [{
      id: 'huge',
      headline: 'huge',
      emoji: '💥',
      effects: [{ target: { ticker: 'BYTE' }, pct: 5.0 }],
    }];
    const update = updateMarket(config, prev, 25, huge, new RNG('cap'));
    const r = (update.prices['BYTE']! - prev['BYTE']!) / prev['BYTE']!;
    // 25% cap plus drift plus noise — ~30% upper bound
    expect(r).toBeLessThan(0.35);
  });
});
