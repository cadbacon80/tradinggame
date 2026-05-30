import type {
  GameConfig,
  Order,
  OrderRequest,
  Player,
  Room,
  RoundSnapshot,
  TickerId,
} from './types';
import { netWorth } from './types';
import { initialPrices, updateMarket } from './economy';
import { sampleNews } from './news';
import { RNG } from './rng';

export function makeRoom(config: GameConfig, host: Pick<Player, 'id' | 'name' | 'emoji'>): Room {
  const player: Player = {
    id: host.id,
    name: host.name,
    emoji: host.emoji,
    cash: config.startingCash,
    holdings: zeroHoldings(config),
    insurance: 0,
    ready: false,
    connected: true,
    joinedAt: Date.now(),
  };
  return {
    id: deriveRoomId(config.seed),
    hostId: host.id,
    status: 'lobby',
    config,
    round: 0,
    phase: 'lobby',
    phaseEndsAt: 0,
    players: { [host.id]: player },
    market: {
      prices: initialPrices(config),
      insurancePrice: config.insurance.startPrice,
      currentNews: [],
      insuranceWindowOpen: false,
    },
    history: [],
    pendingOrders: [],
    version: 0,
  };
}

export function addPlayer(room: Room, p: Pick<Player, 'id' | 'name' | 'emoji'>): Room {
  if (room.players[p.id]) {
    return updatePlayer(room, p.id, (player) => ({ ...player, connected: true }));
  }
  if (room.status !== 'lobby') {
    return room;
  }
  return bumpVersion({
    ...room,
    players: {
      ...room.players,
      [p.id]: {
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        cash: room.config.startingCash,
        holdings: zeroHoldings(room.config),
        insurance: 0,
        ready: false,
        connected: true,
        joinedAt: Date.now(),
      },
    },
  });
}

export function startGame(room: Room, now = Date.now()): Room {
  if (room.status !== 'lobby') return room;
  return enterNewsPhase({ ...room, status: 'playing', round: 1 }, now);
}

export function advancePhase(room: Room, now = Date.now()): Room {
  switch (room.phase) {
    case 'lobby':
      return room;
    case 'news':
      return enterTradingPhase(room, now);
    case 'trading':
      return enterResolvingPhase(room, now);
    case 'resolving': {
      if (room.round >= room.config.totalRounds) {
        return bumpVersion({ ...room, phase: 'gameover', status: 'finished', phaseEndsAt: 0 });
      }
      return enterNewsPhase({ ...room, round: room.round + 1 }, now);
    }
    case 'gameover':
      return room;
  }
}

function enterNewsPhase(room: Room, now: number): Room {
  const rng = phaseRng(room.config.seed, room.round, 'news');
  const used = new Set<string>();
  for (const snap of room.history) for (const n of snap.news) used.add(n.id);
  const news = sampleNews(rng, room.round, room.config.totalRounds, room.config.insuranceRounds, used);
  const insuranceWindow = room.round > 1 && room.config.insuranceRounds.includes(room.round);
  return bumpVersion({
    ...room,
    phase: 'news',
    phaseEndsAt: now + room.config.newsRevealSeconds * 1000,
    market: { ...room.market, currentNews: news, insuranceWindowOpen: insuranceWindow },
    pendingOrders: [],
  });
}

function enterTradingPhase(room: Room, now: number): Room {
  return bumpVersion({
    ...room,
    phase: 'trading',
    phaseEndsAt: now + room.config.tradingSeconds * 1000,
    players: Object.fromEntries(
      Object.entries(room.players).map(([id, p]) => [id, { ...p, ready: false }]),
    ),
  });
}

function enterResolvingPhase(room: Room, now: number): Room {
  const rng = phaseRng(room.config.seed, room.round, 'resolve');
  const pricesBefore = { ...room.market.prices };
  const insBefore = room.market.insurancePrice;
  const update = updateMarket(room.config, pricesBefore, insBefore, room.market.currentNews, rng);

  const snapshot: RoundSnapshot = {
    round: room.round,
    pricesBefore,
    pricesAfter: update.prices,
    insurancePriceBefore: insBefore,
    insurancePriceAfter: update.insurancePrice,
    news: room.market.currentNews,
    orders: room.pendingOrders,
    leaderboard: computeLeaderboard(room, update.prices, update.insurancePrice),
  };

  return bumpVersion({
    ...room,
    phase: 'resolving',
    phaseEndsAt: now + room.config.resolutionSeconds * 1000,
    market: {
      ...room.market,
      prices: update.prices,
      insurancePrice: update.insurancePrice,
      insuranceWindowOpen: false,
    },
    history: [...room.history, snapshot],
  });
}

export interface OrderResult {
  room: Room;
  order?: Order;
  error?: string;
}

export function placeOrder(room: Room, req: OrderRequest, now = Date.now()): OrderResult {
  if (room.phase !== 'trading') return { room, error: 'Trading phase is not open.' };
  const player = room.players[req.playerId];
  if (!player) return { room, error: 'Unknown player.' };

  if (req.kind === 'stock') {
    const price = room.market.prices[req.ticker];
    if (price == null) return { room, error: `Unknown ticker ${req.ticker}.` };
    const lot = room.config.lotSize;
    const cost = price * lot;
    if (req.side === 'buy') {
      if (player.cash < cost) return { room, error: 'Not enough cash.' };
    } else {
      const have = player.holdings[req.ticker] ?? 0;
      if (have < lot) return { room, error: 'Not enough shares.' };
    }
    const next = applyStockOrder(room, player, req.ticker, req.side, lot, price);
    const order: Order = {
      id: `${player.id}-${room.round}-${room.pendingOrders.length}`,
      playerId: player.id,
      round: room.round,
      ts: now,
      kind: 'stock',
      ticker: req.ticker,
      side: req.side,
      qty: lot,
      executedPrice: price,
    };
    return {
      room: bumpVersion({ ...next, pendingOrders: [...next.pendingOrders, order] }),
      order,
    };
  }

  // insurance
  if (!room.market.insuranceWindowOpen) return { room, error: 'Insurance window is closed.' };
  const price = room.market.insurancePrice;
  if (req.side === 'buy') {
    if (player.cash < price) return { room, error: 'Not enough cash.' };
  } else {
    if (player.insurance < 1) return { room, error: 'No insurance to sell.' };
  }
  const next = applyInsuranceOrder(room, player, req.side, price);
  const order: Order = {
    id: `${player.id}-${room.round}-${room.pendingOrders.length}`,
    playerId: player.id,
    round: room.round,
    ts: now,
    kind: 'insurance',
    side: req.side,
    qty: 1,
    executedPrice: price,
  };
  return {
    room: bumpVersion({ ...next, pendingOrders: [...next.pendingOrders, order] }),
    order,
  };
}

function applyStockOrder(
  room: Room,
  player: Player,
  ticker: TickerId,
  side: 'buy' | 'sell',
  qty: number,
  price: number,
): Room {
  const sign = side === 'buy' ? 1 : -1;
  const newHoldings = { ...player.holdings, [ticker]: (player.holdings[ticker] ?? 0) + sign * qty };
  const newCash = player.cash - sign * qty * price;
  return updatePlayer(room, player.id, (p) => ({ ...p, holdings: newHoldings, cash: newCash }));
}

function applyInsuranceOrder(
  room: Room,
  player: Player,
  side: 'buy' | 'sell',
  price: number,
): Room {
  const sign = side === 'buy' ? 1 : -1;
  return updatePlayer(room, player.id, (p) => ({
    ...p,
    insurance: p.insurance + sign,
    cash: p.cash - sign * price,
  }));
}

export function setReady(room: Room, playerId: string, ready: boolean): Room {
  return updatePlayer(room, playerId, (p) => ({ ...p, ready }));
}

export function allReady(room: Room): boolean {
  const players = Object.values(room.players).filter((p) => p.connected);
  return players.length > 0 && players.every((p) => p.ready);
}

export function computeLeaderboard(
  room: Room,
  prices: Record<TickerId, number>,
  insurancePrice: number,
): Array<{ playerId: string; netWorth: number }> {
  return Object.values(room.players)
    .map((p) => ({
      playerId: p.id,
      netWorth: netWorth(p, { prices, insurancePrice, currentNews: [], insuranceWindowOpen: false }),
    }))
    .sort((a, b) => b.netWorth - a.netWorth);
}

function zeroHoldings(config: GameConfig): Record<TickerId, number> {
  const out: Record<TickerId, number> = {};
  for (const t of config.tickers) out[t.id] = 0;
  return out;
}

function updatePlayer(room: Room, id: string, mutator: (p: Player) => Player): Room {
  const player = room.players[id];
  if (!player) return room;
  return bumpVersion({ ...room, players: { ...room.players, [id]: mutator(player) } });
}

function bumpVersion(room: Room): Room {
  return { ...room, version: room.version + 1 };
}

function phaseRng(seed: string, round: number, label: string): RNG {
  return new RNG(`${seed}:${round}:${label}`);
}

export function deriveRoomId(seed: string): string {
  // Produce a stable 4-char uppercase room code from the seed.
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit ambiguous chars
  let code = '';
  let x = h >>> 0;
  for (let i = 0; i < 4; i++) {
    code += alpha[x % alpha.length];
    x = Math.floor(x / alpha.length);
    if (x === 0) x = (h ^ (i + 1) * 0x9e3779b9) >>> 0;
  }
  return code;
}

export function newRoomSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
