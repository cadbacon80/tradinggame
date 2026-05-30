# Bootstrap checklist

Tasks I (the agent) can't do for you because they need your accounts. After these, every code change you (or the agent) push goes live automatically.

## 1. Create the GitHub repo

```bash
# Option A — using the GitHub CLI (https://cli.github.com/)
brew install gh
gh auth login
cd /Users/juanrojas/Documents/dev/tradinggame
gh repo create tradinggame --private --source=. --remote=origin --push

# Option B — manual
# Create an empty repo named "tradinggame" at https://github.com/new
# Then from this directory:
git remote add origin git@github.com:<you>/tradinggame.git
git branch -M main
git push -u origin main
```

## 2. Create the Supabase project (free tier)

1. Sign in at https://supabase.com and create a new project (any region, free plan).
2. Once provisioned, copy:
   - **Project URL** (e.g. `https://xxxxxxxx.supabase.co`)
   - **anon public key** (Settings → API)
3. Apply the schema:
   - Supabase Studio → SQL editor → paste contents of `supabase/migrations/0001_rooms.sql` → run.
4. Enable Realtime on the `rooms` table:
   - Supabase Studio → Database → Replication → toggle on for `rooms`.

## 3. Create the Cloudflare Pages project (free tier)

1. Sign in at https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick the `tradinggame` GitHub repo.
3. Build settings:
   - Framework preset: `Vite`
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
   - Node version: `20` (set under "Environment variables (production)" as `NODE_VERSION=20`)
4. Environment variables (**both Production AND Preview**):
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
5. Save and deploy. The site lands at `https://tradinggame.pages.dev` (or whatever subdomain CF assigns).

## 4. Local dev

```bash
cd /Users/juanrojas/Documents/dev/tradinggame
cp .env.example .env.local
# fill in the two VITE_* values from step 2

npm install
npm run dev           # http://localhost:5173
npm test
npm run typecheck
npm run sim           # headless balance simulator
npm run build         # production build
```

## 5. The deploy loop you'll use from now on

```bash
git checkout -b feat/<name>
# edit code
npm run typecheck && npm test
git commit -am "feat: <what>"
git push -u origin feat/<name>
# Cloudflare Pages auto-deploys a preview at https://<branch>.tradinggame.pages.dev
# Open a PR, review, merge to main. Prod auto-deploys to the main domain.
```

## 6. (Optional) Custom domain

Cloudflare Pages → your project → Custom domains → add yours. Free SSL included.

## 7. Without Supabase

The app runs in **offline mode** when `VITE_SUPABASE_*` are unset: solo play and pass-the-phone work, but no online multiplayer. Useful for the first deploy before Supabase is wired up.
