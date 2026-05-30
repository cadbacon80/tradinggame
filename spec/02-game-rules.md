# 02 — Game Rules

## Lobby

1. **Host** taps "Create game", picks round count (default 8) and trading-phase timer (default 30s), gets a **4-character uppercase room code** (e.g. `BULL`), a QR code, and a shareable link `https://<host>/r/BULL`.
2. **Players** tap "Join", enter the code (or scan QR), pick a **display name** (max 12 chars) and **emoji avatar**.
3. Host sees the roster fill in. When ≥2 players are present, host taps **Start**.
4. Joining is blocked once the game starts. Reconnection by the same player ID is allowed throughout.

## Round structure

Every round runs through three phases in order. Phase transitions are timer-driven; the host's client is authoritative (see [06-network-protocol.md](06-network-protocol.md)).

### Phase A — News reveal (~5 s)

- 1–2 news items shake onto the screen with emoji + headline
- Players read; no trading allowed yet
- Insurance window opens here on rounds listed in `config.insuranceRounds`

### Phase B — Trading (default 30 s)

- All players act **simultaneously**. There is no turn order within a round.
- Available actions:
  - **Buy stock** — tap `+5` on a ticker. Cash debits at the **currently displayed price × 5**. Repeatable while cash allows.
  - **Sell stock** — tap `-5` on a ticker you hold. Cash credits at displayed price × 5.
  - **Buy insurance** *(only if insurance window is open)* — tap `+1 INS`. Cash debits by insurance price.
  - **Sell insurance** *(only if insurance window is open, and you hold ≥1 unit)* — tap `-1 INS`.
  - **Ready** — optional toggle that ends the player's trading for this round. If all players are ready, the phase ends early.
- A player may queue multiple actions back-to-back. Each action commits immediately (no preview-and-confirm in v1; tap is the confirmation).

### Phase C — Resolution (~5–10 s)

- Orders are already executed (each tap committed in Phase B). This phase visualizes the market move:
  - Display each news item's effect arrow on each affected ticker
  - Animate price ticks to their new values
  - Recompute net worth and update the leaderboard
- Insurance price updates here whether or not the window is open this round.

After the final round's resolution, the game transitions to **Game Over**.

## Player constraints

- **Cannot go below 0 cash.** Buys that would exceed available cash are rejected at tap time.
- **Cannot hold negative shares.** No short selling in v1.
- **Cannot hold negative insurance units.** No short vol in v1.
- **Lot size = 5 shares** for stocks. UI exposes only `+5` / `-5` buttons.
- **Insurance trades in single units** (qty 1).
- All prices and cash are **integers** in game-coins.

## Win condition

- After the final resolution phase, each player's **net worth** is computed:
  - `netWorth = cash + Σ(shares_t × finalPrice_t) + insuranceUnits × finalInsurancePrice`
- Highest net worth wins.
- **Tiebreaker**: more insurance units held (rewards the hedger). If still tied, alphabetical by name (deterministic, boring on purpose).

## Game over

- Podium screen with top 3 + emoji
- Full leaderboard with each player's cash, holdings, and net worth
- Buttons:
  - **Play again** — same lobby, reset state, same config
  - **New game** — same lobby, return to host config screen
  - **Leave**

## Edge cases

- **Player disconnects mid-round**: their orders so far stand. They stop placing new ones. If they reconnect before round end, they can resume. If not, they're marked "AFK" and continue to hold their portfolio (no auto-liquidation).
- **Host disconnects**: host migration to next-oldest connected player (v2). v1: game pauses for 30s; if host doesn't return, room shows "Game ended early" and the leaderboard at last known state.
- **All players leave**: room is garbage-collected after 10 minutes of inactivity.

## Open decisions

- **Simultaneous vs. sequential trading**: spec says simultaneous. Confirm.
- **Action confirmation**: spec says one-tap commit. Should slip-protection (price changed since tap) exist? In v1 the price doesn't change mid-phase, so not needed.
- **Insurance windows**: default `[3, 5, 7]` — confirm cadence.
- **Host migration**: ship in v1 or v2?
