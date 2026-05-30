export type RoomId = string;
export type PlayerId = string;
export type TickerId = string;

export interface TickerConfig {
  id: TickerId;
  name: string;
  sector: string;
  /** Short company logo emoji shown next to the ticker tag. */
  emoji: string;
  /** One-line "what they do" backstory, shown in the info sheet. */
  description: string;
  startPrice: number;
  drift?: number;
}

export interface InsuranceConfig {
  /** Starting price in game-coins. */
  startPrice: number;
  /** Sensitivity to (mean |ticker return| − baselineMag). 5.0 by default. */
  k: number;
  /** "Quiet round" magnitude. Rounds with mean |return| below this bleed INS. */
  baselineMag: number;
  /** Noise term, ± fraction. */
  noisePct: number;
}

export interface GameConfig {
  totalRounds: number;
  tradingSeconds: number;
  newsRevealSeconds: number;
  resolutionSeconds: number;
  startingCash: number;
  lotSize: number;
  insuranceRounds: number[];
  tickers: TickerConfig[];
  insurance: InsuranceConfig;
  stockNoisePct: number;
  seed: string;
}

export type Phase = 'lobby' | 'news' | 'trading' | 'resolving' | 'gameover';

export interface Player {
  id: PlayerId;
  name: string;
  emoji: string;
  cash: number;
  holdings: Record<TickerId, number>;
  insurance: number;
  ready: boolean;
  connected: boolean;
  joinedAt: number;
}

export interface Market {
  prices: Record<TickerId, number>;
  insurancePrice: number;
  currentNews: NewsItem[];
  insuranceWindowOpen: boolean;
}

export type NewsTarget =
  | 'market'
  | { sector: string }
  | { ticker: TickerId };

export interface NewsEffect {
  target: NewsTarget;
  pct: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  emoji: string;
  effects: NewsEffect[];
  weight?: number;
  minRound?: number;
  flavorOnly?: boolean;
}

export type Order =
  | {
      id: string;
      playerId: PlayerId;
      round: number;
      ts: number;
      kind: 'stock';
      ticker: TickerId;
      side: 'buy' | 'sell';
      qty: number;
      executedPrice: number;
    }
  | {
      id: string;
      playerId: PlayerId;
      round: number;
      ts: number;
      kind: 'insurance';
      side: 'buy' | 'sell';
      qty: number;
      executedPrice: number;
    };

export type OrderRequest =
  | {
      playerId: PlayerId;
      kind: 'stock';
      ticker: TickerId;
      side: 'buy' | 'sell';
    }
  | {
      playerId: PlayerId;
      kind: 'insurance';
      side: 'buy' | 'sell';
    };

export interface RoundSnapshot {
  round: number;
  pricesBefore: Record<TickerId, number>;
  pricesAfter: Record<TickerId, number>;
  insurancePriceBefore: number;
  insurancePriceAfter: number;
  news: NewsItem[];
  orders: Order[];
  leaderboard: Array<{ playerId: PlayerId; netWorth: number }>;
}

export interface Room {
  id: RoomId;
  hostId: PlayerId;
  status: 'lobby' | 'playing' | 'finished';
  config: GameConfig;
  round: number;
  phase: Phase;
  phaseEndsAt: number;
  players: Record<PlayerId, Player>;
  market: Market;
  history: RoundSnapshot[];
  pendingOrders: Order[];
  version: number;
}

export function netWorth(p: Player, m: Market): number {
  let total = p.cash;
  for (const t in p.holdings) total += (p.holdings[t] ?? 0) * (m.prices[t] ?? 0);
  total += p.insurance * m.insurancePrice;
  return total;
}
