# 07 — UI / UX

Mobile-first, portrait orientation. Designed for thumb reach on a 5–6" phone screen. All tap targets ≥ 44 px.

## Screen flow

```
Splash ──► Join ──┬──► Lobby (player) ──┐
                  │                     ├──► Round (loop) ──► Game Over ──► Lobby
Splash ──► Create ────► Lobby (host) ──┘
```

## Screens

### Splash

- App logo + title
- Two big buttons stacked: **Create game** / **Join game**
- Tiny footer: build hash, link to GitHub

### Join

- 4-character code input (auto-uppercase, numeric keypad off, large monospace)
- Name input (max 12 chars), emoji picker (grid of ~24 curated emoji)
- **Join** button (disabled until name + valid code)
- "Scan QR" link opens device camera (PWA Web Share Target / `getUserMedia`)

### Host config (between Create and Lobby)

- Round count slider (5–10)
- Trading-phase seconds (15 / 30 / 45)
- (advanced collapsed) Starting cash, insurance rounds
- **Create room** → goes to Lobby with code

### Lobby

- Top: big room code (e.g. `BULL`), tap to copy, QR icon opens full-screen QR
- Player list: emoji + name, "host" badge
- Host: **Start game** button (disabled until ≥ 2 players)
- Players: "Waiting for host…" pulse
- All: **Leave** in top-right

### Round (main screen)

Layout, top to bottom:

1. **Header bar** (sticky)
   - `Round 3 of 8` left
   - Phase pill (`NEWS` / `TRADING` / `RESOLVING`) center
   - Timer ring right, counts down `phaseEndsAt - now`
2. **News card** — emoji + headline, animates in during news phase, stays visible (slightly faded) through trading
3. **Stocks list** — 5 rows. Each row:
   - Left: ticker tag (color-coded by sector), short name
   - Middle: current price (large), tiny sparkline of last 3 rounds
   - Right: your holdings count, `−5` and `+5` buttons stacked
4. **Insurance card**
   - Always visible
   - Shows INS price, your units, a small chip indicating window status:
     - `OPEN` during insurance rounds (full color, buttons enabled)
     - `LOCKED` otherwise (grayed, buttons disabled, helper text "Opens round 5")
   - `−1` and `+1` buttons
5. **Sticky footer**
   - Cash: large number left
   - Net worth: smaller, right
   - Tap to expand mini-leaderboard (top 3 + "you" row)
   - **Ready** toggle (right edge) ends your trading early

### Resolution overlay

- During Phase C, fade the trading UI behind a translucent overlay
- Animate each ticker's price change: arrow + delta
- Insurance card animates same way
- 5–10 second visual digest before the next round

### Game Over

- Confetti
- Podium: top 3 with crowns + net worth
- Full leaderboard list
- Buttons: **Play again** (host only) / **Leave**

## Interactions

- **Buy/Sell**: single tap. Haptic blip on success, sharper haptic on `ORDER_REJECT`.
- **Spam-tap protection**: each button is debounced to ~1 tap per 50ms purely to prevent double-fires from finger judder; otherwise rapid tapping is expected (and fun).
- **Optimistic UI**: prices/holdings/cash update immediately on tap. Rollback on rare `ORDER_REJECT`.
- **No drag, no long-press** required for v1.

## Visual language

- High contrast, bright accent colors per sector. Default sector palette:
  - consumer: amber, pets: pink, space: indigo, biotech: teal, energy/etc: lime
- Up = green arrow, Down = red arrow, but **also** use arrow direction and parentheses to avoid color-only signaling for accessibility.
- Typography: 1 display weight for prices (tabular numerals), 1 body weight for everything else.
- Iconography: emoji where possible, no custom icon set in v1.

## Accessibility

- All interactive elements have aria-labels with current values ("Buy 5 FZZL at 60. You have 2 cash, no positions.")
- Color contrast: WCAG AA minimum
- Respects `prefers-reduced-motion`: skips price-ticker animation
- Pinch-zoom not blocked

## Audio

- Optional, off by default. Toggle in header menu.
- Short SFX: tap (soft pop), news (whoosh), resolution tick (digital chime), game over (fanfare)

## PWA shell

- Installable: manifest with name "Bull Run", icons 192/512, theme color, background color
- Offline behavior: cached shell loads, but a game in progress requires connection — shows "Reconnecting…" overlay if Realtime channel drops, auto-retries

## Open decisions

- **Theme**: bright/cartoony vs. dark Bloomberg-parody. Spec leans bright/cartoony.
- **Avatars**: emoji-only vs. generated SVG faces? Spec says emoji for speed.
- **Mini-leaderboard placement**: always-visible top-3 strip vs. tap-to-expand. Spec says tap-to-expand to save screen space.
