/**
 * Headless balance simulator.
 *
 *   npm run sim                       # 1000 games, default config
 *   npm run sim -- --games 5000       # more iterations
 *
 * Plays N games with simple bot strategies (always-long, always-cash, insurance-on-window)
 * and prints distribution stats relevant to balance tuning.
 */

import { makeConfig } from './config';
import { makeRoom, startGame, advancePhase, placeOrder, computeLeaderboard, newRoomSeed } from './engine';
import type { OrderRequest, Player, Room } from './types';

type BotName = 'long' | 'cash' | 'insurance';

function botAction(bot: BotName, room: Room, player: Player): OrderRequest[] {
  const actions: OrderRequest[] = [];
  switch (bot) {
    case 'cash':
      return actions;
    case 'long': {
      // Spread cash roughly evenly across all tickers, lot by lot.
      const tickers = room.config.tickers;
      let cash = player.cash;
      for (const t of tickers) {
        const price = room.market.prices[t.id];
        const lot = room.config.lotSize;
        if (price * lot <= cash) {
          actions.push({ playerId: player.id, kind: 'stock', ticker: t.id, side: 'buy' });
          cash -= price * lot;
        }
      }
      return actions;
    }
    case 'insurance': {
      if (room.market.insuranceWindowOpen && player.cash >= room.market.insurancePrice) {
        actions.push({ playerId: player.id, kind: 'insurance', side: 'buy' });
      }
      return actions;
    }
  }
}

function runOne(seed: string): {
  winner: BotName;
  net: Record<BotName, number>;
  startingCash: number;
} {
  const config = makeConfig(seed);
  const host = { id: 'p-long', name: 'Long', emoji: '📈' };
  let room = makeRoom(config, host);
  room = { ...room, players: {
    ...room.players,
    'p-cash': makePlayer('p-cash', 'Cash', '💰', config.startingCash, config.tickers.map((t) => t.id)),
    'p-ins': makePlayer('p-ins', 'Hedge', '🛡️', config.startingCash, config.tickers.map((t) => t.id)),
  } };

  room = startGame(room);

  while (room.phase !== 'gameover') {
    if (room.phase === 'trading') {
      for (const [id, player] of Object.entries(room.players)) {
        const bot: BotName = id === 'p-long' ? 'long' : id === 'p-cash' ? 'cash' : 'insurance';
        for (const action of botAction(bot, room, player)) {
          const r = placeOrder(room, action);
          room = r.room;
        }
      }
    }
    room = advancePhase(room, room.phaseEndsAt + 1);
  }

  const leaderboard = computeLeaderboard(room, room.market.prices, room.market.insurancePrice);
  const lookup = new Map(leaderboard.map((e) => [e.playerId, e.netWorth]));
  const net: Record<BotName, number> = {
    long: lookup.get('p-long') ?? 0,
    cash: lookup.get('p-cash') ?? 0,
    insurance: lookup.get('p-ins') ?? 0,
  };
  const winnerEntry = leaderboard[0];
  const winner: BotName = winnerEntry.playerId === 'p-long' ? 'long' : winnerEntry.playerId === 'p-cash' ? 'cash' : 'insurance';
  return { winner, net, startingCash: config.startingCash };
}

function makePlayer(id: string, name: string, emoji: string, cash: number, tickers: string[]): Player {
  const holdings: Record<string, number> = {};
  for (const t of tickers) holdings[t] = 0;
  return {
    id,
    name,
    emoji,
    cash,
    holdings,
    insurance: 0,
    ready: false,
    connected: true,
    joinedAt: 0,
  };
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function quantile(xs: number[], q: number): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)));
  return sorted[idx];
}

function main() {
  const args = process.argv.slice(2);
  const gamesArg = args.indexOf('--games');
  const games = gamesArg >= 0 ? Number(args[gamesArg + 1]) : 1000;

  const wins: Record<BotName, number> = { long: 0, cash: 0, insurance: 0 };
  const netLong: number[] = [];
  const netCash: number[] = [];
  const netIns: number[] = [];
  let startingCash = 0;

  for (let i = 0; i < games; i++) {
    const seed = `sim-${i}-${newRoomSeed()}`;
    const r = runOne(seed);
    wins[r.winner] += 1;
    netLong.push(r.net.long);
    netCash.push(r.net.cash);
    netIns.push(r.net.insurance);
    startingCash = r.startingCash;
  }

  console.log(`\nSimulation: ${games} games, starting cash ${startingCash}\n`);
  console.log(`Win rate:  long ${(wins.long / games * 100).toFixed(1)}%   cash ${(wins.cash / games * 100).toFixed(1)}%   insurance ${(wins.insurance / games * 100).toFixed(1)}%`);

  for (const [label, xs] of [['long', netLong], ['cash', netCash], ['insurance', netIns]] as const) {
    const mn = mean(xs);
    const p10 = quantile(xs, 0.1);
    const p50 = quantile(xs, 0.5);
    const p90 = quantile(xs, 0.9);
    console.log(`${label.padEnd(10)} mean=${mn.toFixed(0)}  p10=${p10.toFixed(0)}  p50=${p50.toFixed(0)}  p90=${p90.toFixed(0)}  mult=${(mn / startingCash).toFixed(2)}x`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
