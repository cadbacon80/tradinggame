# 10 — Build Plan

Phased plan for the implementing agent. Each phase is small, independently runnable, and ends with a demoable checkpoint. The agent should commit at the end of each phase and rely on the pipeline described in [11-workflow.md](11-workflow.md) to push and deploy.

## Phase 0 — Repo + pipeline bootstrap

**Goal**: an empty PWA is live at `bull-run.pages.dev`.

- Create GitHub repo `tradinggame`
- `app/` Vite + React + TS scaffold (`pnpm create vite app --template react-ts`)
- Tailwind, Zustand, `vite-plugin-pwa`, ESLint, Prettier, Vitest
- Manifest + icons (placeholder OK)
- `.github/workflows/ci.yml`: typecheck + lint + test on PR
- Create Cloudflare Pages project, link to GitHub repo, build command `pnpm install && pnpm --filter app build`, output dir `app/dist`
- Add Supabase project, capture URL + anon key, set as CF Pages env vars (prod + preview)
- Hello-world screen confirms the deploy

**Definition of done**: pushing to `main` makes a public URL update within ~2 minutes.

## Phase 1 — Local single-player engine (offline)

**Goal**: a playable sandbox with no network. Validates the economy in the browser.

- `game/types.ts`, `game/config.ts`, `game/rng.ts`, `game/economy.ts`, `game/news.ts`, `game/news.json` (~30 seed items)
- `game/engine.ts`: round state machine (lobby → news → trading → resolving → gameover)
- React screens: Splash, Round (skip Lobby in this phase; auto-create one player), Game Over
- Buttons commit orders immediately to local engine state
- Headless `pnpm sim`: 1000-game sim runner per [09-balancing.md](09-balancing.md)
- Unit tests for `economy.ts` and `news.ts` sampler

**DoD**: a single player can play an 8-round game in the browser. `pnpm sim` reports balance metrics.

## Phase 2 — Multiplayer over Supabase

**Goal**: 2–8 players on different phones play one game together.

- `supabase/migrations/0001_rooms.sql`: `rooms` table + RLS
- `net/supabase.ts`: client init from env
- `net/channel.ts`: open/close room channel, presence
- `net/messages.ts`: discriminated union of protocol messages from [06-network-protocol.md](06-network-protocol.md)
- Host engine drives the room channel and persists state per round
- Player client: optimistic UI, `ORDER_ACK` / `ORDER_REJECT` handling
- Reconnect path: load room state from row, subscribe channel, send JOIN
- Lobby screen + Join screen with code input + QR

**DoD**: 4 players across 4 phones can finish a game; refresh on any non-host phone recovers state.

## Phase 3 — Mobile polish + Fun Pack

**Goal**: feels like a finished party game on a phone, and it's actually *fun*.

Polish:
- PWA install prompt, manifest polished, icons final
- News reveal animation, resolution price-tick animation
- SFX (optional toggle), haptics on buy/sell/reject
- QR full-screen modal for join
- Empty/error/disconnect states styled

Fun Pack (see [12-fun-pack.md](12-fun-pack.md)) — land in this order, each as its own PR:
1. End-game awards
2. Rumors (engine support + UI stamp)
3. Themed rounds
4. Power Hour
5. Insider Tips
6. Hot streak flair, custom titles, mini-story cycles
7. Sound snippets

**DoD**: installable PWA, Fun Pack on by default, no obvious rough edges in a 6-player playtest, and at least one Fun Pack feature triggers a laugh in playtest.

## Phase 4 — Tuning + content

**Goal**: the game is actually fun.

- Playtest with 4+ humans, capture qualitative feedback
- Expand news catalog to 50+ items, balanced across tickers
- Adjust constants in `09-balancing.md` based on `pnpm sim` outputs and playtest
- Add a small in-app changelog

**DoD**: playtest groups want to play more than once in a sitting.

## Phase 5 — Stretch (post-v1)

- Host migration on host disconnect
- Bot players for solo / table-filler
- Sector ETF stock
- Limit orders
- Short selling toggle (per-game)
- Spectator mode
- Localized news catalogs
- Server-authoritative mode via Supabase Edge Functions (closes the trust gap)

## Acceptance criteria (for "v1 ship")

- Pipeline: `git push origin main` results in a live update at the production URL within 3 minutes, no manual steps
- Functionality: 4 players on 4 phones can complete a full game without bugs
- Performance: round trip player tap → host ack → UI update p95 < 500ms on home WiFi
- Quality: zero TypeScript errors, ESLint clean, Vitest green
- Quotas: a 50-game month stays inside Supabase + Cloudflare free tiers

## Open decisions

- **Skip Phase 1 sandbox?** Spec says no — the offline engine is a force-multiplier for tuning before any network code exists. Confirm.
- **Test coverage target?** v1: cover `economy.ts` and `engine.ts` (pure logic). UI testing skipped.
