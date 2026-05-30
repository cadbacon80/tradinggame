# 09 — Balancing

All values live in `app/src/game/config.ts` so playtesting is a single-file change. Treat the numbers below as v1 starting points.

## Game-level constants

```ts
export const DEFAULTS = {
  totalRounds: 8,            // 5..10 allowed via lobby slider
  tradingSeconds: 30,        // 15 / 30 / 45 allowed
  newsRevealSeconds: 5,
  resolutionSeconds: 6,
  startingCash: 1000,
  lotSize: 5,
  insuranceRounds: [3, 5, 7],
};
```

## Stocks

```ts
export const TICKERS: TickerConfig[] = [
  { id: 'FZZL', name: 'Fizzle Bev',     sector: 'consumer', startPrice: 60,  drift: 0 },
  { id: 'BARK', name: 'Bark & Co',       sector: 'pets',     startPrice: 80,  drift: 0 },
  { id: 'MOON', name: 'Moonshot Tours',  sector: 'space',    startPrice: 120, drift: 0.005 },
  { id: 'CRSP', name: 'Crispr Goose',    sector: 'biotech',  startPrice: 95,  drift: 0 },
  { id: 'DRIP', name: 'Drip Coffee',     sector: 'consumer', startPrice: 45,  drift: 0 },
];

export const STOCK_NOISE_PCT = 0.02;  // ±2% per round
```

`MOON` carries a small positive drift to make it an interesting long even without news, balanced by higher absolute noise impact (high price × ±2%).

## Insurance

```ts
export const INSURANCE: InsuranceConfig = {
  startPrice: 25,
  k: 5.0,           // sensitivity to (mean|return| − baselineMag)
  baselineMag: 0.02,// rounds with mean|return| below 2% bleed INS
  noisePct: 0.03,   // ±3%
};
```

### Sanity checks (magnitude model)

| Scenario | mean(\|return\|) | INS multiplier | Direction |
|---|---|---|---|
| Big crash | ~6% | `1 + 5·(0.06−0.02) = 1.20` | INS +20% |
| Big rally | ~6% | `1 + 5·(0.06−0.02) = 1.20` | INS +20% |
| Single-ticker shock | ~3% | `1 + 5·0.01 = 1.05` | INS +5% |
| Normal mixed round | ~2% | `1.00` | INS flat |
| Quiet noise round | ~1% | `1 + 5·(−0.01) = 0.95` | INS −5% |

INS is a **volatility bet**, not a directional one. Owners get paid when the market is loud (crash or rally), and pay rent in quiet rounds. The hedge against declines still works because crashes are the loudest events on the tape.

## News effect sizing

| Effect type | typical pct |
|---|---|
| flavor-only | 0 |
| single-ticker mild | ±5% to ±8% |
| single-ticker strong | ±9% to ±15% |
| market-wide soft | ±1% to ±3% |
| market-wide major | ±4% to ±6% |

Caps: no single round's combined effect on a ticker should exceed ±25%. Enforce in the news loader.

## Round 1 softening

- Force `news_effect` magnitude ≤ 6% on round 1
- No insurance window on round 1 even if listed in `insuranceRounds`

## Playtest targets

Use these as acceptance criteria for "is the game balanced":

- **Winner net worth**: median 1.3×–2.0× starting cash. Outside this band → adjust news magnitudes.
- **Last place net worth**: median ≥ 0.7× starting cash. If lower → reduce per-round market noise or cap loss-per-round.
- **Insurance utility**: in games containing a ≥4% down round, an INS holder going into that round should end the round better off than they would have without INS in ≥60% of simulations. Tune `k` and `decay` until true.
- **Pace**: median game length 9–11 minutes. Trim `resolutionSeconds` or `newsRevealSeconds` if it slips.

## Tooling for tuning

Phase 1 ships a `pnpm sim` script that runs 1000 headless games against simple bot strategies (always-long, always-cash, insurance-on-window) and prints:

- Distribution of winner net worth
- Distribution of last-place net worth
- INS Sharpe-ish ratio
- Frequency of "boring" rounds (no news effect > 3%)

This is the feedback loop for editing constants in this file.

## Open decisions

- **5 vs 4 tickers**: 5 fits comfortably on a phone screen but is tight. Confirm.
- **Drift per ticker**: spec gives MOON +0.5%/round. Reduce/remove if it makes MOON a free buy.
- **Hard caps**: ±25% per-round cap on a single ticker. Confirm.
