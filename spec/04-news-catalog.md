# 04 — News Catalog

News drives the market. Most of the personality of the game lives here.

## Schema

```ts
type NewsEffect = {
  // target the whole market, a sector tag, or a specific ticker
  target: 'market' | { sector: string } | { ticker: TickerId };
  pct: number;          // signed; applied multiplicatively to the next price tick
};

type NewsItem = {
  id: string;           // stable slug
  headline: string;     // <= 80 chars, one-liner, no trailing period needed
  emoji: string;        // 1–2 emoji
  effects: NewsEffect[];
  weight?: number;      // sampling weight (default 1)
  minRound?: number;    // earliest round it can appear
  flavorOnly?: boolean; // true if effects[] is empty/tiny — purely for laughs
};
```

## Sampler rules

- **Round 1** always draws from items tagged "soft" — small absolute effects (<6%) so players can ease in.
- **Insurance-eligible rounds** (`config.insuranceRounds`) draw at least one item with `|effect| >= 6%` on either `market` or a single ticker, so the insurance choice has real stakes.
- The same item never repeats within one game.
- 1–2 items per round. ~30% chance of a second flavor-only item alongside the mechanical one.

## Initial catalog (sample — flesh out during Phase 4)

These are seeds. The implementing agent should expand to ~50 items, half mechanical, half flavor, with a roughly even split across tickers.

```json
[
  {
    "id": "fzzl-pickle-soda",
    "headline": "FZZL launches sparkling pickle soda. Sales bubble up.",
    "emoji": "🥒🥤",
    "effects": [{ "target": { "ticker": "FZZL" }, "pct": 0.12 }]
  },
  {
    "id": "bark-cat-hack",
    "headline": "A stray cat hacks BARK servers. Stock chases its tail.",
    "emoji": "🐱💻",
    "effects": [
      { "target": { "ticker": "BARK" }, "pct": -0.08 },
      { "target": "market", "pct": -0.01 }
    ]
  },
  {
    "id": "moon-sunscreen",
    "headline": "MOON tourist forgets sunscreen on the Sun. CEO unfazed.",
    "emoji": "🌞🧴",
    "effects": [{ "target": { "ticker": "MOON" }, "pct": 0.02 }],
    "flavorOnly": false
  },
  {
    "id": "drip-shortage",
    "headline": "Coffee shortage rumor brews. DRIP panics, baristas weep.",
    "emoji": "☕😱",
    "effects": [{ "target": { "ticker": "DRIP" }, "pct": -0.10 }]
  },
  {
    "id": "crsp-geese-fly",
    "headline": "CRSP geese learn to file taxes. Investors call it disruptive.",
    "emoji": "🦢📈",
    "effects": [{ "target": { "ticker": "CRSP" }, "pct": 0.09 }]
  },
  {
    "id": "market-regulator-dunk",
    "headline": "Regulator dunks on crypto. Equities rattle in sympathy.",
    "emoji": "🏛️📉",
    "effects": [{ "target": "market", "pct": -0.04 }]
  },
  {
    "id": "market-rate-cut",
    "headline": "Central bank surprise rate cut. Everyone parties.",
    "emoji": "🏦🎉",
    "effects": [{ "target": "market", "pct": 0.05 }]
  },
  {
    "id": "moon-bezos-pet",
    "headline": "Billionaire books MOON trip for his dog. BARK applauds.",
    "emoji": "🐕🚀",
    "effects": [
      { "target": { "ticker": "MOON" }, "pct": 0.06 },
      { "target": { "ticker": "BARK" }, "pct": 0.04 }
    ]
  },
  {
    "id": "drip-oat-milk",
    "headline": "DRIP debuts oat-milk-of-the-month club. Subscriptions froth.",
    "emoji": "🥛📬",
    "effects": [{ "target": { "ticker": "DRIP" }, "pct": 0.07 }]
  },
  {
    "id": "fzzl-recall",
    "headline": "FZZL recalls sparkling broth. Customers unsurprised.",
    "emoji": "🥣🚫",
    "effects": [{ "target": { "ticker": "FZZL" }, "pct": -0.09 }]
  },
  {
    "id": "flavor-intern",
    "headline": "Intern leaves stove on at the NYSE. Trading continues.",
    "emoji": "🔥🏛️",
    "effects": [],
    "flavorOnly": true
  },
  {
    "id": "flavor-pigeon",
    "headline": "Pigeon roosts on a bull statue. Becomes new index mascot.",
    "emoji": "🕊️🐂",
    "effects": [],
    "flavorOnly": true
  }
]
```

## Storage

- Stored as a JSON file shipped with the client: `app/src/game/news.json`
- Loaded into memory at game start, sampled by the host
- Localization: v1 ships English only. JSON is the localization seam.

## Open decisions

- **Catalog size**: 50+ items for variety with 8-round games? Confirm.
- **Tone**: confirm "absurd but PG" voice. No politics, no celebrity names that age fast.
- **Sector tags**: ship sector tags or skip and target tickers directly? Spec includes both options in the schema.
