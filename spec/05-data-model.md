# 05 — Data Model

TypeScript-flavored types. These should land verbatim in `app/src/game/types.ts` during Phase 0.

```ts
// ─── identifiers ─────────────────────────────────────────────
export type RoomId = string;       // 4 uppercase letters, e.g. "BULL"
export type PlayerId = string;     // uuid v4 generated client-side
export type TickerId = string;     // 4 uppercase letters

// ─── config ──────────────────────────────────────────────────
export interface TickerConfig {
  id: TickerId;
  name: string;
  sector: string;
  startPrice: number;
  drift?: number;        // default 0
}

export interface InsuranceConfig {
  startPrice: number;
  k: number;             // sensitivity to market drops
  decay: number;         // calm-round decay (negative number)
  noisePct: number;      // ±
}

export interface GameConfig {
  totalRounds: number;           // default 8
  tradingSeconds: number;        // default 30
  newsRevealSeconds: number;     // default 5
  resolutionSeconds: number;     // default 5
  startingCash: number;          // default 1000
  lotSize: number;               // default 5
  insuranceRounds: number[];     // default [3,5,7]
  tickers: TickerConfig[];       // length 5 in v1
  insurance: InsuranceConfig;
  stockNoisePct: number;         // default 0.02
  seed: string;                  // room code + timestamp
}

// ─── room + game state ───────────────────────────────────────
export type Phase = 'lobby' | 'news' | 'trading' | 'resolving' | 'gameover';

export interface Room {
  id: RoomId;
  hostId: PlayerId;
  status: 'lobby' | 'playing' | 'finished';
  config: GameConfig;
  round: number;                 // 0 in lobby, 1..totalRounds during play
  phase: Phase;
  phaseEndsAt: number;           // epoch ms
  players: Record<PlayerId, Player>;
  market: Market;
  history: RoundSnapshot[];      // append-only, one per completed round
  version: number;               // optimistic concurrency counter
}

export interface Player {
  id: PlayerId;
  name: string;                  // max 12 chars
  emoji: string;
  cash: number;
  holdings: Record<TickerId, number>;   // shares, ≥0
  insurance: number;                    // units, ≥0
  ready: boolean;
  connected: boolean;
  joinedAt: number;
}

export interface Market {
  prices: Record<TickerId, number>;
  insurancePrice: number;
  currentNews: NewsItem[];        // items active this round
  insuranceWindowOpen: boolean;
}

// ─── orders & history ────────────────────────────────────────
export type Order =
  | {
      playerId: PlayerId;
      round: number;
      ts: number;
      kind: 'stock';
      ticker: TickerId;
      side: 'buy' | 'sell';
      qty: number;               // multiple of lotSize
      executedPrice: number;     // per share
    }
  | {
      playerId: PlayerId;
      round: number;
      ts: number;
      kind: 'insurance';
      side: 'buy' | 'sell';
      qty: number;               // integer
      executedPrice: number;     // per unit
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

// ─── news (mirrors 04-news-catalog.md) ───────────────────────
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
```

## Persistence shape (Supabase)

Minimal table for reconnect/late-join support. Active gameplay broadcasts over the realtime channel; this table is the durable mirror.

```sql
create table rooms (
  id            text primary key,             -- 4-char code
  state         jsonb not null,               -- the Room object above
  version       integer not null default 0,
  updated_at    timestamptz not null default now()
);

create index rooms_updated_at on rooms (updated_at);
-- Cleanup job: delete rooms where updated_at < now() - interval '1 hour'
```

Row Level Security: anonymous read/write on `rooms` is acceptable for v1 (party game, no PII, no money). Gate by `id` lookup only. v2 could move authority into an Edge Function.

## Net-worth derivation

Always derived, never stored. Pure function over `Player + Market`:

```ts
function netWorth(p: Player, m: Market): number {
  let total = p.cash;
  for (const t in p.holdings) total += p.holdings[t] * (m.prices[t] ?? 0);
  total += p.insurance * m.insurancePrice;
  return total;
}
```

## Open decisions

- **Storage backend**: Supabase Postgres + Realtime, per [08-tech-stack.md](08-tech-stack.md). Confirm.
- **Order log**: keep full order log in `history`? Useful for replay/postgame stats, modest size (≤ ~500 orders/game). Spec says yes.
- **Player IDs**: client-generated uuid stored in `localStorage` per device. Confirm — alternative is server-issued, requires an Edge Function.
