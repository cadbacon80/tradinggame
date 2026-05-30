# 06 — Network Protocol

## Topology

**Client-host model.** One device (the room creator) runs the game engine. All other players subscribe to a Supabase Realtime channel and send their actions through it. The host persists each authoritative state transition into the `rooms` Postgres row so late-joiners and reconnections can rehydrate.

### Why client-host

- No server code to write/deploy in v1
- Stays well inside Supabase free tier (one row write per phase change, broadcasts are cheap)
- Latency: only host→player one-way is in the critical path; player taps execute locally on the host's authoritative state via channel messages

### Cost / failure mode of client-host

- Host disconnect = game pause (then host migration in v2 or end-of-game in v1)
- Host can in principle tamper with state. Mitigated by deterministic seed + price update math that all clients verify (see [03-economy.md](03-economy.md)). Not a security boundary — appropriate for a party game.

## Channel

- One Realtime channel per room: `room:<RoomId>` (e.g. `room:BULL`)
- Channel uses **broadcast** events (low-latency, ephemeral, no DB write per message)
- Per-room presence is tracked via Supabase Realtime presence for connection liveness

## Messages

All messages are JSON. `type` is the discriminator.

### Host → all players (broadcast)

| `type` | When | Payload |
|---|---|---|
| `STATE_SYNC` | On player join, on phase change, every 5s as heartbeat | full `Room` object |
| `PHASE_CHANGE` | On phase transition | `{ phase, round, phaseEndsAt }` |
| `MARKET_TICK` | End of resolution phase | `{ prices, insurancePrice, round }` |
| `NEWS` | Start of news phase | `{ items: NewsItem[], round }` |
| `ORDER_ACK` | After each player order is accepted | `{ orderId, order }` |
| `ORDER_REJECT` | After each player order is rejected | `{ reason, originalOrder }` |
| `LEADERBOARD` | End of resolution phase + game over | `{ entries: Array<{playerId, netWorth}> }` |
| `GAME_OVER` | After final resolution | `{ podium, finalLeaderboard, history }` |

### Player → host (channel send)

| `type` | Payload |
|---|---|
| `JOIN` | `{ playerId, name, emoji }` |
| `ORDER` | `Order` (without `executedPrice` — host fills it in) |
| `READY` | `{ playerId, ready: boolean }` |
| `LEAVE` | `{ playerId }` |
| `PING` | `{ playerId, ts }` (host responds with `PONG` for RTT) |

## Order handling

1. Player taps `+5` on FZZL. Client constructs an `ORDER` message and sends on the channel.
2. **Optimistic UI**: the client *also* decrements cash and increments holdings locally with the displayed price so the tap feels instant.
3. Host receives `ORDER`, validates against authoritative state:
   - Phase is `trading`
   - Player exists, is connected
   - For stock: ticker exists, qty is a positive multiple of `lotSize`, cash sufficient (if buy), holdings sufficient (if sell)
   - For insurance: window is open, qty is positive integer, cash/units sufficient
4. If valid: host applies the order, broadcasts `ORDER_ACK` with `executedPrice` filled. Players who don't own this order ignore it; the player who placed it confirms their optimistic state matches.
5. If invalid: host broadcasts `ORDER_REJECT` to that player only (via direct broadcast keyed by `playerId`). Client rolls back its optimistic state and shows a brief toast (e.g. "Not enough cash").

## Phase loop on the host

```
while round <= totalRounds:
  enterPhase('news', NEWS_REVEAL_SECONDS)
    sample news, set market.currentNews, broadcast NEWS + PHASE_CHANGE
    wait until phaseEndsAt
  enterPhase('trading', TRADING_SECONDS)
    open insurance window if round in insuranceRounds
    broadcast PHASE_CHANGE
    accept orders until timer expires OR all players ready
  enterPhase('resolving', RESOLUTION_SECONDS)
    compute new prices, new insurance price (per 03-economy.md)
    update market, append RoundSnapshot to history
    broadcast MARKET_TICK + LEADERBOARD + PHASE_CHANGE
    persist room state to Postgres
    wait until phaseEndsAt
  round += 1
broadcast GAME_OVER
```

## Reconnect & late join

- On client load with a `?room=BULL&playerId=xyz` URL or saved localStorage:
  1. Client fetches `rooms` row via Supabase REST: `select state from rooms where id = $1`.
  2. Subscribes to `room:BULL` channel.
  3. Sends `JOIN` (the host distinguishes new-join vs. reconnect by `playerId` presence in `room.players`).
- Host replies with `STATE_SYNC` (full state) on the channel direct to that client.

## Persistence cadence

- Persist full `Room` JSON to `rooms` row at end of every `resolving` phase (so at most one round of state is lost on host crash).
- Lighter periodic save (every 10s) optional in v2.

## Rate limits & quotas

Supabase Realtime free tier (as of writing): 200 concurrent peak connections, 2M messages/month, 500 channel joins/min. Back-of-envelope for one 8-round game with 8 players:
- ~8 phase changes × ~9 broadcasts each ≈ ~70 broadcasts per phase loop × 8 ≈ ~500 messages/game
- Comfortable inside free tier even at hundreds of games per month

## Open decisions

- **Host migration in v1?** Spec says no (v2 feature). Confirm.
- **Per-message signing?** Skipped in v1 (party game, no $). Confirm.
- **Alternative backend (Firebase, PartyKit)?** Confirm Supabase pick — see [08-tech-stack.md](08-tech-stack.md).
