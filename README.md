# Bull Run

A mobile-first multiplayer party trading game for 2–8 phones. ~10 minutes per game. Fictional stocks, silly news headlines, a volatility instrument you can use to hedge crashes — and play big swings.

- **Spec**: [`spec/README.md`](spec/README.md) (12 numbered modules)
- **Bootstrap** (external accounts): [`BOOTSTRAP.md`](BOOTSTRAP.md)
- **Dev workflow**: [`spec/11-workflow.md`](spec/11-workflow.md)

## Quick start

```bash
npm install
npm run dev           # http://localhost:5173
```

Without `.env.local`, the app runs in **offline mode** — solo and pass-the-phone play work. To enable online multiplayer, follow [BOOTSTRAP.md](BOOTSTRAP.md).

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TS strict typecheck, no emit |
| `npm run lint` | ESLint |
| `npm test` | Vitest run |
| `npm run sim` | Headless 1000-game balance sim |

## Stack

React + Vite + TypeScript PWA · Tailwind · Zustand · Supabase Realtime · Cloudflare Pages. See [`spec/08-tech-stack.md`](spec/08-tech-stack.md).

## License

UNLICENSED — private project. Change in `package.json` when ready to share.
