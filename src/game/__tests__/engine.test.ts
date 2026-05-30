import { describe, it, expect } from 'vitest';
import { makeConfig } from '../config';
import {
  makeRoom,
  addPlayer,
  startGame,
  advancePhase,
  placeOrder,
  setReady,
  allReady,
  newRoomSeed,
} from '../engine';

const host = { id: 'host', name: 'Host', emoji: '🐂' };
const alice = { id: 'alice', name: 'Alice', emoji: '🦊' };

function freshRoom() {
  const config = makeConfig(newRoomSeed(), { totalRounds: 3, insuranceRounds: [3] });
  return makeRoom(config, host);
}

describe('engine — lobby + start', () => {
  it('creates a room in the lobby phase with the host as the only player', () => {
    const room = freshRoom();
    expect(room.phase).toBe('lobby');
    expect(room.round).toBe(0);
    expect(Object.keys(room.players)).toEqual([host.id]);
    expect(room.players[host.id]!.cash).toBe(room.config.startingCash);
  });

  it('adds players while in lobby and refuses after start', () => {
    let room = freshRoom();
    room = addPlayer(room, alice);
    expect(Object.keys(room.players)).toHaveLength(2);
    room = startGame(room, 0);
    const before = Object.keys(room.players).length;
    room = addPlayer(room, { id: 'late', name: 'Late', emoji: '🐢' });
    expect(Object.keys(room.players)).toHaveLength(before);
  });

  it('start moves us into the news phase of round 1', () => {
    let room = freshRoom();
    room = startGame(room, 1000);
    expect(room.phase).toBe('news');
    expect(room.round).toBe(1);
    expect(room.phaseEndsAt).toBe(1000 + room.config.newsRevealSeconds * 1000);
  });
});

describe('engine — phase progression', () => {
  it('walks news -> trading -> resolving -> news (next round)', () => {
    let room = freshRoom();
    room = startGame(room, 0);
    expect(room.phase).toBe('news');
    room = advancePhase(room, 0);
    expect(room.phase).toBe('trading');
    room = advancePhase(room, 0);
    expect(room.phase).toBe('resolving');
    expect(room.history.length).toBe(1);
    room = advancePhase(room, 0);
    expect(room.phase).toBe('news');
    expect(room.round).toBe(2);
  });

  it('ends the game after the final round', () => {
    let room = freshRoom(); // 3 rounds
    room = startGame(room, 0);
    for (let i = 0; i < 9; i++) room = advancePhase(room, 0);
    expect(room.phase).toBe('gameover');
    expect(room.status).toBe('finished');
    expect(room.history.length).toBe(3);
  });

  it('opens the insurance window only on listed rounds (and never round 1)', () => {
    let room = freshRoom(); // insuranceRounds: [3]
    room = startGame(room, 0);
    expect(room.market.insuranceWindowOpen).toBe(false); // round 1
    room = advancePhase(room, 0); // trading
    room = advancePhase(room, 0); // resolving
    room = advancePhase(room, 0); // round 2 news
    expect(room.market.insuranceWindowOpen).toBe(false);
    room = advancePhase(room, 0); // round 2 trading
    room = advancePhase(room, 0); // round 2 resolving
    room = advancePhase(room, 0); // round 3 news
    expect(room.market.insuranceWindowOpen).toBe(true);
  });
});

describe('engine — orders', () => {
  it('rejects orders outside the trading phase', () => {
    let room = freshRoom();
    room = startGame(room, 0); // news
    const r = placeOrder(room, { playerId: host.id, kind: 'stock', ticker: 'BYTE', side: 'buy' });
    expect(r.error).toMatch(/trading/i);
  });

  it('debits cash on buy and credits on sell', () => {
    let room = freshRoom();
    room = startGame(room, 0);
    room = advancePhase(room, 0); // trading
    const startCash = room.players[host.id]!.cash;
    const price = room.market.prices['BYTE']!;
    const r1 = placeOrder(room, { playerId: host.id, kind: 'stock', ticker: 'BYTE', side: 'buy' });
    expect(r1.error).toBeUndefined();
    room = r1.room;
    expect(room.players[host.id]!.cash).toBe(startCash - price * room.config.lotSize);
    expect(room.players[host.id]!.holdings['BYTE']).toBe(room.config.lotSize);
    const r2 = placeOrder(room, { playerId: host.id, kind: 'stock', ticker: 'BYTE', side: 'sell' });
    expect(r2.error).toBeUndefined();
    room = r2.room;
    expect(room.players[host.id]!.cash).toBe(startCash);
    expect(room.players[host.id]!.holdings['BYTE']).toBe(0);
  });

  it('rejects buy if insufficient cash', () => {
    let room = freshRoom();
    room = startGame(room, 0);
    room = advancePhase(room, 0);
    room = { ...room, players: { ...room.players, [host.id]: { ...room.players[host.id]!, cash: 1 } } };
    const r = placeOrder(room, { playerId: host.id, kind: 'stock', ticker: 'BYTE', side: 'buy' });
    expect(r.error).toMatch(/cash/i);
  });

  it('rejects sell if no shares', () => {
    let room = freshRoom();
    room = startGame(room, 0);
    room = advancePhase(room, 0);
    const r = placeOrder(room, { playerId: host.id, kind: 'stock', ticker: 'MOON', side: 'sell' });
    expect(r.error).toMatch(/shares/i);
  });

  it('rejects insurance trades when window is closed', () => {
    let room = freshRoom();
    room = startGame(room, 0);
    room = advancePhase(room, 0);
    const r = placeOrder(room, { playerId: host.id, kind: 'insurance', side: 'buy' });
    expect(r.error).toMatch(/window/i);
  });

  it('allows insurance trades on listed rounds', () => {
    let room = freshRoom(); // insuranceRounds: [3]
    room = startGame(room, 0);
    // Advance to round 3 trading
    for (let i = 0; i < 7; i++) room = advancePhase(room, 0);
    expect(room.round).toBe(3);
    expect(room.phase).toBe('trading');
    expect(room.market.insuranceWindowOpen).toBe(true);
    const r = placeOrder(room, { playerId: host.id, kind: 'insurance', side: 'buy' });
    expect(r.error).toBeUndefined();
    expect(r.room.players[host.id]!.insurance).toBe(1);
  });
});

describe('engine — ready toggle', () => {
  it('reports allReady once every connected player is ready', () => {
    let room = freshRoom();
    room = addPlayer(room, alice);
    room = startGame(room, 0);
    room = advancePhase(room, 0); // trading
    expect(allReady(room)).toBe(false);
    room = setReady(room, host.id, true);
    expect(allReady(room)).toBe(false);
    room = setReady(room, alice.id, true);
    expect(allReady(room)).toBe(true);
  });
});
