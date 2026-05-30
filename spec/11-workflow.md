# 11 — Dev & Deploy Workflow (Prompt → Code → Push → Deploy)

This module defines the end-to-end loop the agent (and the human) follow to get from an idea to a live update. The goal: a single push to `main` is the only deploy ceremony.

## Loop diagram

```
 ┌───────────┐   ┌────────────┐   ┌────────────┐   ┌──────────────┐   ┌─────────────────┐
 │  Prompt   │ → │  Code      │ → │  Verify    │ → │  Push        │ → │  Deploy (auto)  │
 │ (human/   │   │ (agent     │   │ (lint,     │   │ (git push    │   │ (Cloudflare     │
 │  agent)   │   │  edits)    │   │  test,     │   │  origin      │   │  Pages builds   │
 │           │   │            │   │  preview)  │   │  branch)     │   │  → live URL)    │
 └───────────┘   └────────────┘   └────────────┘   └──────────────┘   └─────────────────┘
                                                                              │
                                                                              ▼
                                                                     ┌─────────────────┐
                                                                     │  Observe play   │
                                                                     │  → next prompt  │
                                                                     └─────────────────┘
```

## Prerequisites (one-time setup)

These are bootstrapped in [Phase 0](10-build-plan.md):

1. **GitHub repo** `tradinggame` (owner: user). Default branch `main`. Branch protection optional.
2. **Cloudflare Pages project** linked to the repo:
   - Production branch: `main`
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter app build`
   - Build output: `app/dist`
   - Node version: `20`
   - Env vars (set in CF Pages dashboard, both Production and Preview):
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
3. **Supabase project**:
   - Capture URL + anon key
   - Apply `supabase/migrations/0001_rooms.sql` via Studio (or `supabase db push` after CLI install)
   - Realtime enabled on the `rooms` table (or pure broadcast channel — see [06-network-protocol.md](06-network-protocol.md))
4. **Local dev**:
   - `pnpm install` at repo root
   - `cp app/.env.example app/.env.local` and fill in Supabase credentials
   - `pnpm --filter app dev` → `http://localhost:5173`

## Branching & commit conventions

- **main**: always deployable, auto-deploys to prod
- **Feature branches**: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>` — auto-deploy to a CF Pages preview URL
- **PRs**: every feature branch goes through a PR. CI runs typecheck + lint + test. Squash-merge to `main`.
- **Commits**: short imperative subject. Conventional-commit prefix is *encouraged not required*:
  - `feat: add insurance window indicator`
  - `fix: reject buy orders when cash exactly zero`
  - `chore: bump tailwind`

## The agent's per-change loop

For each task the agent picks up:

1. **Read** the relevant spec file(s) in `spec/`. Spec is the source of truth.
2. **Plan** the change in TodoWrite (or equivalent). Keep edits small enough to land in one PR.
3. **Branch** off main: `git checkout -b feat/<name>`.
4. **Edit** code under `app/src/`.
5. **Verify locally**:
   - `pnpm --filter app dev` — sanity-check in browser
   - `pnpm --filter app typecheck`
   - `pnpm --filter app lint`
   - `pnpm --filter app test`
   - For balance changes: `pnpm --filter app sim`
6. **Commit** with a descriptive message.
7. **Push** the branch. CF Pages publishes a preview URL within ~90 seconds.
8. **Open a PR**, link the preview URL in the description.
9. **Iterate** on review feedback by pushing more commits — the preview URL updates in place.
10. **Squash-merge** to `main` once approved. Prod deploy auto-triggers.
11. **Verify prod**: open production URL, confirm change is live. Note any regressions for the next loop.

## Top-level npm scripts (root `package.json`)

```json
{
  "scripts": {
    "dev":       "pnpm --filter app dev",
    "build":     "pnpm --filter app build",
    "typecheck": "pnpm --filter app typecheck",
    "lint":      "pnpm --filter app lint",
    "test":      "pnpm --filter app test",
    "sim":       "pnpm --filter app sim",
    "preview":   "pnpm --filter app preview"
  }
}
```

The agent should treat these as the only entry points so future tooling changes don't break the workflow.

## CI workflow (`.github/workflows/ci.yml`)

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
```

CI does not deploy. Cloudflare Pages handles deploy directly from the GitHub integration.

## Database migrations

- Migration files live in `supabase/migrations/NNNN_<name>.sql`.
- v1 process: agent edits SQL, opens PR, and the human applies it via Supabase Studio after merge. Manual but safe.
- v2 process: GitHub Action runs `supabase db push` against the prod project using a service-role key stored in repo secrets. Open: include this in v1 or defer? Defer to keep the bootstrap minimal.

## Secrets handling

| Secret | Where it lives | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | CF Pages env (Prod+Preview), local `.env.local` | Public-safe |
| `VITE_SUPABASE_ANON_KEY` | CF Pages env (Prod+Preview), local `.env.local` | Public-safe, RLS protects data |
| Supabase service role key | Not used in v1 client | Only needed for v2 migration automation, store in GitHub Actions secret |

Never commit `.env.local`. `.gitignore` lists it.

## Rollback

- **Code rollback**: `git revert <sha>` on `main`, push. CF Pages redeploys to the reverted state.
- **Hotfix**: branch off `main`, fix, PR, merge.
- **Schema rollback**: write a new migration that reverses the previous one. Don't edit prior migrations.

## Quality gates before merge

- All CI jobs green
- Manual smoke test on the preview URL (load app, create room, join from a second device)
- If touching `game/economy.ts`, `engine.ts`, or news: `pnpm sim` reported within balance bands from [09-balancing.md](09-balancing.md)

## Open decisions

- **Branch protection on `main`**: enable required CI + 1 review? Spec leans yes once two contributors exist; off for solo bootstrap.
- **Preview deploys for every branch or only PRs?** CF Pages default is every branch; spec keeps the default.
- **Automated DB migrations in v1?** Spec says defer — manual via Studio for v1, automate in v2.
- **Single repo vs. monorepo with multiple apps?** Spec uses a single repo with one `app/` workspace, sized to grow into a monorepo if needed (Phase 5 bots, etc).
