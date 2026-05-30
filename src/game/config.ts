import type { GameConfig, TickerConfig, InsuranceConfig } from './types';

// Six fictional companies across six sectors — like Monopoly properties:
// each one is a recognizable archetype with a logo and a one-line backstory.
export const TICKERS: TickerConfig[] = [
  {
    id: 'MOON',
    name: 'Moonshot Tours',
    sector: 'space',
    emoji: '🚀',
    description: 'Sells tickets to the Sun. Sunscreen extra. CEO insists it\'s "totally safe."',
    startPrice: 120,
    drift: 0.005,
  },
  {
    id: 'BYTE',
    name: 'ByteCity Cloud',
    sector: 'tech',
    emoji: '💾',
    description: 'Rents you a computer in the sky. Slogan: "your data, our basement."',
    startPrice: 95,
    drift: 0,
  },
  {
    id: 'TLKR',
    name: 'Talker Telecom',
    sector: 'comms',
    emoji: '📡',
    description: 'Carrier pigeons + fiber. Still has dial tones, somehow profitable.',
    startPrice: 75,
    drift: 0,
  },
  {
    id: 'BANX',
    name: 'Banx Bank',
    sector: 'banks',
    emoji: '🏦',
    description: 'Friendly bank with a goldfish mascot named Larry. Vault is also a fishbowl.',
    startPrice: 60,
    drift: 0,
  },
  {
    id: 'GOLD',
    name: 'Greedy Pete\'s Gold',
    sector: 'metals',
    emoji: '🪙',
    description: 'Family-run since 1849. "Can\'t eat it, but it feels nice in piles."',
    startPrice: 110,
    drift: 0,
  },
  {
    id: 'WATT',
    name: 'Wattbros Power',
    sector: 'energy',
    emoji: '⚡',
    description: 'Lightning in a bottle. Literally. Don\'t open the bottles.',
    startPrice: 50,
    drift: 0,
  },
];

export const INSURANCE: InsuranceConfig = {
  startPrice: 25,
  k: 5.0,
  baselineMag: 0.02,
  noisePct: 0.03,
};

/** Insurance opens every other round starting at round 3, up to totalRounds−1. */
export function defaultInsuranceRounds(totalRounds: number): number[] {
  const out: number[] = [];
  for (let r = 3; r < totalRounds; r += 2) out.push(r);
  return out;
}

export type SessionSize = 'small' | 'medium' | 'large';

export interface SessionPreset {
  label: string;
  totalRounds: number;
  estimatedMinutes: string;
  description: string;
}

export const SESSION_PRESETS: Record<SessionSize, SessionPreset> = {
  small:  { label: 'Small',  totalRounds: 5,  estimatedMinutes: '~6 min',  description: 'Snappy. One insurance window.' },
  medium: { label: 'Medium', totalRounds: 8,  estimatedMinutes: '~10 min', description: 'Standard. Three insurance windows.' },
  large:  { label: 'Large',  totalRounds: 12, estimatedMinutes: '~15 min', description: 'Long. Five insurance windows.' },
};

export const DEFAULT_SESSION: SessionSize = 'medium';

export const DEFAULT_CONFIG: Omit<GameConfig, 'seed'> = {
  totalRounds: SESSION_PRESETS[DEFAULT_SESSION].totalRounds,
  tradingSeconds: 30,
  newsRevealSeconds: 5,
  resolutionSeconds: 6,
  startingCash: 1500,
  lotSize: 5,
  insuranceRounds: defaultInsuranceRounds(SESSION_PRESETS[DEFAULT_SESSION].totalRounds),
  tickers: TICKERS,
  insurance: INSURANCE,
  stockNoisePct: 0.02,
};

export function makeConfig(seed: string, overrides: Partial<GameConfig> = {}): GameConfig {
  // If caller overrides totalRounds but not insuranceRounds, scale the windows.
  const next = { ...DEFAULT_CONFIG, seed, ...overrides };
  if (overrides.totalRounds != null && overrides.insuranceRounds == null) {
    next.insuranceRounds = defaultInsuranceRounds(next.totalRounds);
  }
  return next;
}

export const MAX_PER_ROUND_PCT = 0.25;
