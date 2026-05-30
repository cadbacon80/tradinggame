# Trading Game — Spec

A mobile-first, multiplayer party trading game. 2–8 players join a room from their phones, react to silly news headlines by buying/selling tiny lots of fictional stocks, and use periodic insurance windows to hedge crashes. Shortest fun game in finance.

## Goal

Build a fully functional, fun party trading game **and** the end-to-end system around it so the loop is **prompt → code → push → deploy** with no manual steps in between. The agent reads this spec, implements changes in `app/`, pushes, and Cloudflare Pages publishes the result.

## How to read this spec

Files are numbered in suggested reading order. Each module is self-contained and ends with an **Open decisions** section listing assumptions to confirm or change.

| # | File | What it covers |
|---|---|---|
| 01 | [overview.md](01-overview.md) | Pitch, players, length, design pillars |
| 02 | [game-rules.md](02-game-rules.md) | Lobby, round/phase flow, player actions, win condition |
| 03 | [economy.md](03-economy.md) | Stocks, synthetic pricing model, insurance (vol-like) mechanic |
| 04 | [news-catalog.md](04-news-catalog.md) | News schema + sample items |
| 05 | [data-model.md](05-data-model.md) | TypeScript types for room/player/order/market state |
| 06 | [network-protocol.md](06-network-protocol.md) | Realtime messages, host model, reconnect |
| 07 | [ui-ux.md](07-ui-ux.md) | Screens, mobile-first layout, accessibility |
| 08 | [tech-stack.md](08-tech-stack.md) | Stack pick, hosting, folder layout |
| 09 | [balancing.md](09-balancing.md) | Default constants and tuning knobs |
| 10 | [build-plan.md](10-build-plan.md) | Phased implementation plan for the agent |
| 11 | [workflow.md](11-workflow.md) | Prompt → code → push → deploy pipeline |
| 12 | [fun-pack.md](12-fun-pack.md) | Optional mechanics: rumors, power hour, insider tips, awards, themed rounds |

## Top-level decisions already made

- **Multiplayer**: online realtime room (4-char code, join from phone)
- **Prices**: fully synthetic (no external market API)
- **Length**: short — ~8 rounds, ~10 minutes (configurable 5–10)
- **Stack recommendation**: React + Vite + TS PWA, Supabase realtime, Cloudflare Pages hosting
- **Pipeline**: GitHub → Cloudflare Pages auto-deploy on push; GH Actions runs typecheck/lint/test on PR

## Working title

Placeholder: **Bull Run**. Open to rename.
