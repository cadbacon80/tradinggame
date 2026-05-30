# 03 — Economy

All prices and cash are integers in game-coins. The market is fully synthetic — no external data.

## Stocks

Five fictional tickers ship with v1. All tunable in [09-balancing.md](09-balancing.md).

| Ticker | Name | Sector | Start price |
|---|---|---|---|
| FZZL | Fizzle Beverages | consumer | 60 |
| BARK | Bark & Co | pets | 80 |
| MOON | Moonshot Tourism | space | 120 |
| CRSP | Crispr Goose | biotech | 95 |
| DRIP | Drip Coffee | consumer | 45 |

## Price update model

After Phase B (trading) ends each round, prices update once for the next round:

```
new_price[t] = clamp(
  round( prev_price[t] * (1 + drift + news_effect[t] + noise) ),
  1, 9999
)
```

- `drift` — small baseline drift per round. Default `0.00`. Tunable per ticker if some sectors should trend up over a game.
- `news_effect[t]` — sum of pct effects from news items targeting ticker `t` or its sector or `market` this round (see [04-news-catalog.md](04-news-catalog.md)).
- `noise` — random per-ticker term, gaussian-ish, clipped to ±2% by default. Different sample per ticker per round. Seeded from the room's RNG so all clients can verify if needed.
- `clamp` floor of 1 prevents zero/negative prices.

### Order execution

- Players see the **pre-update price** during the trading phase. Their orders execute at that displayed price the instant they tap. There is no order book or matching.
- This means orders execute, then the price moves at the end of the round — players are pricing the **news effect ahead of the market**, which is the core skill.

### Demand-driven price impact (deferred to v2)

Not in v1. A possible later addition: net buy volume nudges price by a small factor at the next tick. Adds emergent strategy but complicates explanation.

## Insurance — the "vol-like" instrument

A single instrument with ticker `INS`. One number, market-wide. It tracks **volatility, not direction** — it pops on any big move (up or down), and bleeds in calm rounds. Players think of it as "the swing-bet": worth holding when something dramatic is about to happen, costly to sit on during a boring market.

### Why it still hedges declines

Crashes are the loudest moves on the tape, and INS pays the most when the average ticker swings hard. So during a meaningful drawdown, INS pops and offsets equity losses. The twist vs. real-world hedging: a roaring rally also pops INS — so a player who's already long-and-winning gets an extra bonus if they happen to also be holding INS, while a player who only owns INS in calm games slowly bleeds out.

### Price update model (magnitude model)

Computed once per round, in Phase C, **whether or not the insurance window is open**:

```
mean_abs_return = mean over all tickers of |new_price[t] - prev_price[t]| / prev_price[t]
new_ins = clamp(
  round( prev_ins * (1 + k * (mean_abs_return - baselineMag) + ins_noise) ),
  1, 9999
)
```

- `k` — sensitivity to the average size of moves. Default `5.0`.
- `baselineMag` — the "boring" magnitude threshold. Default `0.02` (≈2%). Rounds where the average absolute ticker move is below this bleed INS; above it, INS rises.
- `ins_noise` — small noise term, default ±3%.

### Worked examples

| Round flavor | mean(\|return\|) | INS multiplier (no noise) | INS direction |
|---|---|---|---|
| Big crash (market −6%, similar magnitudes everywhere) | ~6.0% | `1 + 5·(0.06−0.02) = 1.20` | **+20%** |
| Big rally (market +6%) | ~6.0% | `1 + 5·(0.04) = 1.20` | **+20%** |
| Single-ticker shock (one ticker ±10%, others quiet) | ~3.0% | `1 + 5·(0.01) = 1.05` | **+5%** |
| Normal mixed round | ~2.0% | `1 + 5·(0) = 1.00` | **0%** |
| Quiet noise-only round | ~1.0% | `1 + 5·(−0.01) = 0.95` | **−5%** |

The interpretation: INS rewards being **right about turbulence**, not being right about direction. Pick it up before a round you expect to be wild; dump it before quiet rounds.

### Player-facing one-liner

> "INS goes up when the market swings hard, either way. It bleeds when nothing happens."

### Insurance trading

- Tradable only on rounds in `config.insuranceRounds` (default `[3, 5, 7]`).
- Always **priced and updated** each round. Owning INS exposes you to its price moves regardless of window status.
- Unit qty = 1. No lot size for INS.
- Buy debits cash by current INS price. Sell credits the same.
- Cannot sell more than you own.

## Net worth

At any moment:
```
netWorth(player) =
  cash
  + Σ over tickers t: shares[t] * displayedPrice[t]
  + insuranceUnits * displayedInsurancePrice
```

This is what the leaderboard ranks on, both mid-game and at end.

## Determinism

- The room has a seeded RNG (seed = room code + start timestamp). All clients can independently verify the price-update math from `prevPrices + news + seed`. This makes desync detection cheap and protects against host tampering in casual play. Not a security boundary — anyone determined enough can still cheat.

## Open decisions

- **Sectors / number of stocks**: 5 stocks is the sweet spot for thumb-reachable list on phones. Confirm.
- **Allow short selling / short vol?** Spec says no. Yes would add strategy and complexity.
- **Insurance as multi-strike options?** Spec says no — single instrument keeps UI simple. A v2 could add "shallow hedge" vs "tail hedge" at different price/payoff curves.
- **Demand-driven price impact**: defer to v2? Spec says yes, defer.
