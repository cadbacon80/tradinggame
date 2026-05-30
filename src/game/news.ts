import type { NewsItem, NewsTarget, TickerId, TickerConfig } from './types';
import type { RNG } from './rng';
import catalog from './news.json';

const ALL_NEWS = catalog as NewsItem[];

export function allNews(): NewsItem[] {
  return ALL_NEWS;
}

function effectMagnitude(item: NewsItem): number {
  return item.effects.reduce((a, e) => a + Math.abs(e.pct), 0);
}

export function sampleNews(
  rng: RNG,
  round: number,
  totalRounds: number,
  insuranceRounds: number[],
  alreadyUsed: Set<string>,
): NewsItem[] {
  const eligible = ALL_NEWS.filter((n) => !alreadyUsed.has(n.id) && (n.minRound ?? 1) <= round);
  if (eligible.length === 0) return [];

  const isFirstRound = round === 1;
  const isInsuranceRound = insuranceRounds.includes(round);

  // Round 1: soft. Pick from items with combined |effect| <= 6%.
  const pool = isFirstRound
    ? eligible.filter((n) => effectMagnitude(n) <= 0.06)
    : eligible;

  let primary: NewsItem;
  if (isInsuranceRound) {
    const punchy = pool.filter((n) => effectMagnitude(n) >= 0.06);
    primary = punchy.length > 0 ? rng.weightedPick(punchy, (n) => n.weight ?? 1) : rng.weightedPick(pool, (n) => n.weight ?? 1);
  } else {
    primary = rng.weightedPick(pool.length > 0 ? pool : eligible, (n) => n.weight ?? 1);
  }

  const out = [primary];

  // ~30% chance of a flavor item alongside, late game only
  if (round >= 3 && totalRounds >= 6 && rng.next() < 0.3) {
    const flavors = eligible.filter((n) => n.flavorOnly && n.id !== primary.id);
    if (flavors.length > 0) {
      out.push(rng.weightedPick(flavors, (n) => n.weight ?? 1));
    }
  }

  return out;
}

export function newsEffectForTicker(
  ticker: TickerConfig,
  news: NewsItem[],
): number {
  let sum = 0;
  for (const item of news) {
    for (const effect of item.effects) {
      if (matchTarget(effect.target, ticker)) sum += effect.pct;
    }
  }
  return sum;
}

function matchTarget(target: NewsTarget, ticker: TickerConfig): boolean {
  if (target === 'market') return true;
  if ('sector' in target) return target.sector === ticker.sector;
  if ('ticker' in target) return target.ticker === ticker.id;
  return false;
}

export function describeTarget(target: NewsTarget): string {
  if (target === 'market') return 'market';
  if ('sector' in target) return target.sector;
  if ('ticker' in target) return target.ticker;
  return '?';
}

// Useful for tests and debugging.
export function newsByTicker(news: NewsItem[]): Record<TickerId, number> {
  const m: Record<TickerId, number> = {};
  for (const item of news) {
    for (const e of item.effects) {
      if (e.target !== 'market' && 'ticker' in e.target) {
        m[e.target.ticker] = (m[e.target.ticker] ?? 0) + e.pct;
      }
    }
  }
  return m;
}
