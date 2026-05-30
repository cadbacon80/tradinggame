import type { GameConfig, NewsItem, TickerId } from './types';
import { newsEffectForTicker } from './news';
import { RNG } from './rng';
import { MAX_PER_ROUND_PCT } from './config';

function clampInt(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(value)));
}

export interface PriceUpdate {
  prices: Record<TickerId, number>;
  insurancePrice: number;
  avgReturn: number;
  perTickerReturn: Record<TickerId, number>;
}

export function updateMarket(
  config: GameConfig,
  prevPrices: Record<TickerId, number>,
  prevInsurance: number,
  news: NewsItem[],
  rng: RNG,
): PriceUpdate {
  const newPrices: Record<TickerId, number> = {};
  const perTickerReturn: Record<TickerId, number> = {};
  let returnSum = 0;
  let returnCount = 0;

  for (const ticker of config.tickers) {
    const prev = prevPrices[ticker.id] ?? ticker.startPrice;
    const drift = ticker.drift ?? 0;
    let effect = newsEffectForTicker(ticker, news);
    if (effect > MAX_PER_ROUND_PCT) effect = MAX_PER_ROUND_PCT;
    if (effect < -MAX_PER_ROUND_PCT) effect = -MAX_PER_ROUND_PCT;
    const noise = rng.gauss() * config.stockNoisePct;
    const multiplier = 1 + drift + effect + noise;
    const next = clampInt(prev * multiplier, 1, 9999);
    newPrices[ticker.id] = next;
    const r = (next - prev) / prev;
    perTickerReturn[ticker.id] = r;
    returnSum += r;
    returnCount += 1;
  }

  const avgReturn = returnCount > 0 ? returnSum / returnCount : 0;

  // Insurance ("vol") update — magnitude model.
  // INS rises when ANY big move happens, in either direction, and bleeds when the market is quiet.
  let absSum = 0;
  for (const id in perTickerReturn) absSum += Math.abs(perTickerReturn[id]);
  const meanAbs = returnCount > 0 ? absSum / returnCount : 0;

  const ins = config.insurance;
  const insNoise = rng.gauss() * ins.noisePct;
  const insMultiplier = 1 + ins.k * (meanAbs - ins.baselineMag) + insNoise;
  const insurancePrice = clampInt(prevInsurance * insMultiplier, 1, 9999);

  return { prices: newPrices, insurancePrice, avgReturn, perTickerReturn };
}

export function initialPrices(config: GameConfig): Record<TickerId, number> {
  const out: Record<TickerId, number> = {};
  for (const t of config.tickers) out[t.id] = t.startPrice;
  return out;
}
