import type { NewsItem, Order, OrderRequest, Player, Room, TickerId } from '../game/types';

/** Host → all */
export type ServerMessage =
  | { type: 'STATE_SYNC'; room: Room }
  | { type: 'PHASE_CHANGE'; phase: Room['phase']; round: number; phaseEndsAt: number }
  | { type: 'MARKET_TICK'; prices: Record<TickerId, number>; insurancePrice: number; round: number }
  | { type: 'NEWS'; items: NewsItem[]; round: number }
  | { type: 'ORDER_ACK'; order: Order }
  | { type: 'ORDER_REJECT'; reason: string; req: OrderRequest; targetPlayerId: string }
  | { type: 'LEADERBOARD'; entries: Array<{ playerId: string; netWorth: number }> }
  | { type: 'GAME_OVER'; finalLeaderboard: Array<{ playerId: string; netWorth: number }> };

/** Player → host */
export type ClientMessage =
  | { type: 'JOIN'; player: Pick<Player, 'id' | 'name' | 'emoji'> }
  | { type: 'ORDER'; req: OrderRequest }
  | { type: 'READY'; playerId: string; ready: boolean }
  | { type: 'LEAVE'; playerId: string }
  | { type: 'PING'; playerId: string; ts: number };
