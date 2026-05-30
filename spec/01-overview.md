# 01 — Overview

## Pitch

A 10-minute party trading game for phones. Everyone in the room joins via a short code on their own device. Each round, a goofy news headline drops, players race to buy or sell tiny lots of fictional stocks at the displayed integer price, and every couple of rounds an insurance instrument opens for trading that behaves like volatility — it pops when the market crashes and decays in calm markets. Highest net worth at the final bell wins.

## Audience

- Friends in the same room or on a call who want a fast, low-stakes game
- Finance-curious players who want to play with hedging without a textbook
- Works for non-finance players because mechanics are surfaced as buttons, not jargon

## Player count

- **2–8 players** per room
- Below 2: solo sandbox mode against synthetic market (stretch, see [10-build-plan.md](10-build-plan.md))
- Above 8: not supported in v1 (timer pressure and UI density)

## Game length

- **8 rounds** default
- Configurable per game: 5–10 rounds at lobby creation
- Round timing target: ~60–75s per round end-to-end (news 5s + trading 30s + resolution 5–10s + buffer)
- Total: ~8–10 minutes

## Platforms

- Mobile-first responsive PWA (portrait)
- Also playable on desktop browsers
- Installable to home screen via PWA manifest
- Requires internet (realtime sync)

## Design pillars

1. **Fast** — no action should require more than two taps. Round timer is short on purpose.
2. **Funny first** — news copy is the personality of the game. Mechanics are simple so the jokes carry the experience.
3. **Light strategy, real choices** — every round has a defensible buy/sell/hold answer based on news + portfolio + cash. Insurance windows add a hedging decision.
4. **No real money, no leaderboards across games** — single-session, no accounts, no persistence beyond the current room.
5. **Free to run** — free hosting + free realtime tier. Stay within free quotas at expected scale.

## Success criteria

- A first-time player can join and play their first round without explanation in <30 seconds
- A full 8-round game completes in <12 minutes wall-clock with 6 players
- At least one news item makes the room laugh per game (subjective playtest goal)
- Insurance is used by ≥1 player in ≥50% of games (else it's not pulling its weight)

## Out of scope (v1)

- Real money, payments, accounts, persistence across sessions
- Real market data
- Short selling, margin, derivatives beyond the single insurance instrument
- Spectators, replays, tournaments
- Native iOS/Android apps (PWA only)

## Open decisions

- **Title**: working title "Bull Run". Final name TBD.
- **Theming**: bright/cartoony vs. dark Bloomberg parody?
- **Account / persistence**: confirm no login. Players are session-scoped.
