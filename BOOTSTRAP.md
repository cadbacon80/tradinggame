# Bootstrap

Goal: get Bull Run live on the internet with one command.

v1 ships on **GitHub Pages** (offline-mode play, no Supabase needed). Online multiplayer is an opt-in add-on — see "Add multiplayer later" at the bottom.

## One-command deploy

```bash
# 1. Authenticate with GitHub (interactive, one-time)
gh auth login           # pick: GitHub.com → HTTPS → Login with web browser

# 2. Deploy
./scripts/deploy.sh
```

That's it. The script:

- Creates a public GitHub repo named `tradinggame`
- Pushes your local commits
- Enables GitHub Pages with the included Actions workflow as the source
- Triggers and waits for the first deploy
- Prints the live URL (`https://<you>.github.io/tradinggame/`)

It's idempotent — safe to re-run anytime.

## After bootstrap: the dev loop

```bash
git checkout -b feat/<name>
# edit code
npm run typecheck && npm test
git commit -am "feat: <what>"
git push -u origin feat/<name>
# Open a PR on GitHub. CI runs typecheck + lint + test.
# Merge to main. Pages auto-redeploys to the live URL.
```

For quick fixes you trust:

```bash
git commit -am "fix: <what>"
git push   # main is auto-deployed by the workflow
```

## Add multiplayer later (optional, ~5 min)

The Supabase client code is already in `src/net/`. To turn online multiplayer on:

1. Create a free Supabase project at https://supabase.com
2. SQL editor → paste `supabase/migrations/0001_rooms.sql` → run
3. Database → Replication → enable for `rooms` table
4. Settings → API → copy **Project URL** and **anon public key**
5. Set them as GitHub repo secrets:
   ```bash
   gh secret set VITE_SUPABASE_URL --body "https://<your>.supabase.co"
   gh secret set VITE_SUPABASE_ANON_KEY --body "<your-anon-key>"
   ```
6. Re-deploy:
   ```bash
   gh workflow run deploy.yml
   ```

Without those secrets, the build succeeds but the game runs in offline mode (no multiplayer rooms).

## Local development

```bash
cp .env.example .env.local       # fill in only if testing multiplayer locally
npm install
npm run dev                       # http://localhost:5173
```

## Custom domain (optional)

GitHub Pages supports custom domains with free SSL. Repo → Settings → Pages → Custom domain.
If you set one, override the Vite base path in CI:

```bash
gh secret set VITE_BASE --body "/"
```
