# 08 — Tech Stack

## Recommendation summary

| Layer | Pick | Why |
|---|---|---|
| Language | TypeScript | Strong types across game engine + UI + network |
| Frontend framework | React 18 + Vite | Fast dev loop, mature ecosystem, mobile-friendly |
| Styling | Tailwind CSS | Tight bundles, mobile-first utilities, no design system overhead |
| State | Zustand | Minimal, no boilerplate, fits a single-room game |
| PWA | `vite-plugin-pwa` | One-line manifest + service worker, installable |
| Realtime / DB | Supabase (free tier) | Realtime channels + Postgres row for reconnect, no server code in v1 |
| Hosting | Cloudflare Pages (free) | Free static + global CDN, auto-deploy from GitHub, free PR preview URLs |
| Repo | GitHub (free private/public) | Required for CF Pages auto-deploy + agent push workflow |
| CI | GitHub Actions (free for public/limited for private) | Lint + typecheck + unit tests on PR; deploy is handled by CF Pages |
| Package manager | npm | Already on the dev machine; no extra install. pnpm/yarn fine as a later swap |
| Node | LTS (20.x) | Stable for Vite |

### Alternatives considered

- **Firebase** instead of Supabase — equally viable. Firestore + Realtime DB also free at this scale. Picked Supabase for SQL + cleaner channel API.
- **PartyKit / Cloudflare Durable Objects** — purpose-built for rooms, but Durable Objects are not on the Workers free tier. Skip for cost.
- **WebRTC P2P** — no backend needed but still requires a signaling server; net complexity is higher than Supabase.
- **Plain HTML/JS** — fine for hotseat, awkward once realtime + state-syncing players are involved.
- **Vercel hosting** — also free and excellent. Picked Cloudflare Pages because its free tier has unlimited bandwidth and fewer build-minute limits for small projects.

## Folder layout

Flat layout (the Vite app **is** the repo, no subfolder):

```
tradinggame/
├── spec/                       # this document
├── public/
│   ├── icon.svg
│   └── manifest.webmanifest
├── src/
│   ├── game/                   # pure game logic (no React, no network)
│   │   ├── types.ts            # from 05-data-model.md
│   │   ├── config.ts           # constants from 09-balancing.md
│   │   ├── economy.ts          # price + insurance updates
│   │   ├── news.ts             # sampler
│   │   ├── news.json           # the catalog (see 04)
│   │   ├── engine.ts           # round state machine
│   │   ├── rng.ts              # seeded RNG
│   │   ├── sim.ts              # headless balance simulator
│   │   └── __tests__/
│   ├── net/                    # supabase client + room channel adapter
│   │   ├── supabase.ts
│   │   ├── channel.ts
│   │   └── messages.ts         # discriminated union of protocol messages
│   ├── state/                  # zustand stores
│   │   ├── playerStore.ts
│   │   └── gameStore.ts
│   ├── ui/                     # React components
│   │   ├── screens/
│   │   │   ├── Splash.tsx
│   │   │   ├── Join.tsx
│   │   │   ├── HostConfig.tsx
│   │   │   ├── Lobby.tsx
│   │   │   ├── Round.tsx
│   │   │   └── GameOver.tsx
│   │   └── components/
│   │       ├── StockRow.tsx
│   │       ├── InsuranceCard.tsx
│   │       ├── NewsCard.tsx
│   │       ├── PhaseHeader.tsx
│   │       └── Leaderboard.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.cjs
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── supabase/
│   └── migrations/
│       └── 0001_rooms.sql
├── .gitignore
├── BOOTSTRAP.md                # one-time external setup steps
└── README.md
```

## Environment variables

`.env.example` (committed, at repo root):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

These are **public-by-design** (anon key only) and set in Cloudflare Pages environment for prod and preview deployments. Local dev uses `app/.env.local` (gitignored).

## CI/CD wiring

See [11-workflow.md](11-workflow.md) for the full prompt → code → push → deploy loop. Short version:

- Push to `main` → Cloudflare Pages builds (`npm ci && npm run build`, output dir `dist`) → live at `https://bull-run.pages.dev`
- Push to any other branch → CF Pages preview deploy at `https://<branch>.bull-run.pages.dev`
- GitHub Actions on PR runs `npm run typecheck`, `npm run lint`, `npm test` (Vitest) — does not deploy
- Supabase schema is managed by SQL files in `supabase/migrations/`, applied manually via Supabase Studio or `supabase db push` (v1 — automating this is in [11-workflow.md](11-workflow.md))

## Domains

- Default: `bull-run.pages.dev` (free Cloudflare subdomain)
- Custom: optional; Cloudflare Pages includes a free custom domain with their free SSL

## Quotas (free tier headroom)

- **Cloudflare Pages**: 500 builds/month, 100 custom domains, unlimited bandwidth
- **Supabase Free**: 500MB Postgres, 2GB bandwidth/month, 200 concurrent realtime connections, 2M realtime messages/month
- **GitHub Actions**: 2000 mins/month private (effectively unlimited for our small CI)

All comfortable for casual party-game scale.

## Open decisions

- **GitHub repo: public or private?** Defaulting to private until first share-ready build, then flip public.
- **pnpm vs npm?** Spec says pnpm. Switch to npm if simpler for the agent's tooling.
- **TypeScript strictness**: spec says `"strict": true` from day 1.
