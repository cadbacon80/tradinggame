import type { GameConfig, TickerConfig, InsuranceConfig } from './types';

export const TICKERS: TickerConfig[] = [
  { id: 'FZZL', name: 'Fizzle Bev',     sector: 'consumer', startPrice: 60,  drift: 0 },
  { id: 'BARK', name: 'Bark & Co',       sector: 'pets',     startPrice: 80,  drift: 0 },
  { id: 'MOON', name: 'Moonshot Tours',  sector: 'space',    startPrice: 120, drift: 0.005 },
  { id: 'CRSP', name: 'Crispr Goose',    sector: 'biotech',  startPrice: 95,  drift: 0 },
  { id: 'DRIP', name: 'Drip Coffee',     sector: 'consumer', startPrice: 45,  drift: 0 },
];

export const INSURANCE: InsuranceConfig = {
  startPrice: 25,
  k: 5.0,
  baselineMag: 0.02,
  noisePct: 0.03,
};

export const DEFAULT_CONFIG: Omit<GameConfig, 'seed'> = {
  totalRounds: 8,
  tradingSeconds: 30,
  newsRevealSeconds: 5,
  resolutionSeconds: 6,
  startingCash: 1000,
  lotSize: 5,
  insuranceRounds: [3, 5, 7],
  tickers: TICKERS,
  insurance: INSURANCE,
  stockNoisePct: 0.02,
};

export function makeConfig(seed: string, overrides: Partial<GameConfig> = {}): GameConfig {
  return { ...DEFAULT_CONFIG, seed, ...overrides };
}

export const MAX_PER_ROUND_PCT = 0.25;
