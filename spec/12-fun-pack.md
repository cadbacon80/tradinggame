# 12 — Fun Pack

A set of optional mechanics layered on top of the base game to make it louder, funnier, and more re-playable. Each one is small, can be toggled off in `GameConfig`, and ships in **Phase 3** of the [build plan](10-build-plan.md).

The design rule: every Fun Pack feature must (a) be explainable in one sentence in-game, (b) be skippable without changing the core loop, and (c) generate a laugh, a brag, or a story.

---

## 1. Rumors 🤥

Some news headlines are **rumors** — they read like real news, but the effect is wrong, inverted, or absent.

- 1 in ~7 news items is a rumor (configurable: `rumorChance: 0.15`).
- Rumor in the UI: looks identical to real news during the news phase. After the resolution tick, a "🤥 RUMOR" stamp slaps onto the headline so the room can groan.
- Mechanics options for a rumor item:
  - **Fizzle** — published `pct` is replaced by ~0 (with a tiny noise term)
  - **Reverse** — the sign of every effect flips
- Player skill payoff: stay calm; don't always trade the news.

`NewsItem` schema gets two optional fields:
```ts
rumor?: boolean;          // marks the item as rumorable
rumorMode?: 'fizzle' | 'reverse';   // default 'fizzle'
```

---

## 2. Power Hour ⚡️

One mid-game round (sampled from rounds 3..N-2 at game start, deterministic from seed) is the **Power Hour**:

- Lot size **doubles** to 10 for stocks, and insurance trades in lots of 2.
- News effects are amplified ×1.5.
- Trading phase gets +10 seconds.
- The header bar plays a marquee animation; an alert sound fires at the start.

Pre-announced at the start of the round, so players see it coming and lean in. Adds a "big swing" moment to every game.

---

## 3. Insider Tip 🤐

At the start of each `news` phase from round 2 onward, **one player at random** (rotating: each player gets at most one tip per game) receives a private peek at the upcoming news headline, shown only on their device for 3 seconds before the public reveal.

- Choosing the player: deterministic from `(seed, round)` so cheating via reload doesn't help.
- The tipped player's UI shows a 🤐 emoji chip "You got a tip!" — other players see no indication.
- Insider tip can still be a **rumor** (see above) — so tips aren't free money, just a slight edge.
- Toggle via `enableInsiderTips: boolean`.

---

## 4. End-Game Awards 🏆

After the podium, hand out 3–5 silly awards based on game history. Cosmetic only; affects no scores.

| Award | Criterion |
|---|---|
| 💎 **Diamond Hands** | Highest single-ticker peak position held to game end |
| 🧻 **Paper Hands** | Most sells of a single ticker within 2 rounds of buying it |
| 🛡️ **Hedge Lord** | Highest peak insurance position |
| 🪙 **Cash King** | Spent the least cash across the game |
| 🦆 **Wild Goose** | Caught the most rumors (placed orders that lost money on the rumor reveal) |
| 🏎️ **First Mover** | Most rounds where they placed the first order of the round |
| 🪦 **Bag Holder** | Held a position that lost ≥30% peak-to-final |
| 🎯 **Pure Luck** | Won the game with ≤3 orders placed across all rounds |

Stored per game; computed from `Room.history` and the order log.

---

## 5. Themed Rounds 🎭

Every round has a mood drawn from a small palette, picked deterministically from the seed at game start. The theme tints the round screen (subtle background, header chip) and biases the news sampler.

| Theme | Effect | Visual |
|---|---|---|
| 🐂 **Bull Bash** | Sampler favors `market > 0` headlines | green tint |
| 🐻 **Bear Cave** | Sampler favors `market < 0` headlines | red tint |
| 🎲 **Volatile** | Sampler doubles stock noise this round | purple tint |
| 🌞 **Sunny** | All effects ×0.5 (a chill round) | yellow tint |
| 🤔 **Mysterious** | News headline is shown WITHOUT effects displayed in the resolution screen | gray tint |

3 of the 8 rounds are themed; the others are plain. Toggle via `themedRoundCount: number`.

---

## 6. Hot Streak Flair 🔥

Track per-player streaks. UI surfaces a flame chip next to their name when:

- **Buying low** — bought a ticker in the round just before it gains ≥6%: +1 streak
- **Selling high** — sold a ticker in the round just before it loses ≥6%: +1 streak
- **Hedging right** — held INS into a round where the market drops ≥4%: +1 streak
- A round with no qualifying event resets the streak to 0.

Streak ≥ 2 shows 🔥; streak ≥ 4 shows 🔥🔥. Pure flavor on the leaderboard.

---

## 7. Custom Player Titles 🎩

When a player picks a name in lobby, suggest a fun **title** from a curated list, pulled randomly: `the Greedy`, `the Lucky`, `Big Time`, `the Last Bull`, etc. Tap to roll again or pick "no title". Title shows next to the emoji in lobby and during the game.

Cosmetic only. Adds character. Title list lives in `src/game/titles.json`.

---

## 8. Mini Story Cycles 📰

Some news items can form a 2-round mini-story. After news item `bark-cat-hack` plays, there's a 60% chance the next round draws its paired follow-up `bark-cat-arrested` (a "wins back the day" item).

Schema addition:
```ts
nextChance?: { id: string; pct: number };   // 'pct' = probability the linked item fires next round
```

Limit: 2 cycles per game so it stays surprising.

---

## 9. Sound Snippets 🔊

Beyond UI SFX:

- **Big up (>+8% on a single ticker)**: cash register `kerching!`
- **Big down (<-8%)**: sad trombone
- **Rumor reveal**: cartoon "wah-wah-wah"
- **Power Hour intro**: short fanfare
- **Game over**: confetti pop + ascending arpeggio

All sound assets are CC0 (e.g. freesound.org with `0` license filter). One file each, <30KB.

---

## 10. Funny Defaults & Mascots

- Default emoji picker: a curated set of 24 emojis that are good portraits (🐱🐶🦊🐼🐸🐙🦄🐝🦖🐢🐝🐧🦔🦦🐹🦇🦋🦩🌶️🥑🥨🍿🌮🍣)
- Default names if a player skips entry: `Anonymous Trader`, `Mr. Money`, `Ms. Margin`, `Captain Cash`, `Dr. Bid`, `Lord Volatility`
- Loading screens swap in rotating fake ticker quotes ("⚠️ Reticulating splines…", "Lubing up the bull statue…", "Asking the squirrel kindly…")

---

## Config additions

```ts
export interface FunPackConfig {
  enabled: boolean;            // master switch
  rumorChance: number;         // 0..1, default 0.15
  enablePowerHour: boolean;    // default true
  enableInsiderTips: boolean;  // default true
  themedRoundCount: number;    // default 3
  enableAwards: boolean;       // default true
  enableHotStreaks: boolean;   // default true
  enableSoundSnippets: boolean;// default true
}
```

`GameConfig.fun?: FunPackConfig` — optional so the base spec still type-checks.

---

## Build phasing

Fun Pack lands in **Phase 3** of [10-build-plan.md](10-build-plan.md), after multiplayer is working. Order inside Phase 3:

1. End-game awards (offline-derivable, pure UI)
2. Rumors (small engine change)
3. Themed rounds (sampler bias)
4. Power Hour (lot-size override)
5. Insider Tips (per-player private message)
6. Hot streak flair, custom titles, mini-story cycles
7. Sound snippets

Each is a separate PR. None are required to ship v1 — they're additive.

## Open decisions

- **All Fun Pack on by default in v1?** Spec says yes. Risk: harder for first-timers. Mitigation: each feature is small and explained inline.
- **Rumor chance**: 15% — too high? too low? Tune via `pnpm sim` after instrumented.
- **Multiplayer fairness**: Insider Tips on by default in competitive groups? Make it a host toggle in the lobby.
