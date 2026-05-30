import { create } from 'zustand';
import type { Room, OrderRequest } from '../game/types';
import {
  makeRoom,
  addPlayer,
  startGame,
  advancePhase,
  placeOrder,
  setReady,
  newRoomSeed,
} from '../game/engine';
import { makeConfig } from '../game/config';

type Screen = 'splash' | 'join' | 'host-config' | 'lobby' | 'round' | 'gameover';

interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'error';
}

interface GameState {
  screen: Screen;
  room: Room | null;
  /** The local player's id (host or joiner). */
  selfId: string | null;
  toasts: Toast[];

  goToSplash: () => void;
  goToJoin: () => void;
  goToHostConfig: () => void;

  createOfflineRoom: (
    host: { id: string; name: string; emoji: string },
    overrides?: Partial<{ totalRounds: number; tradingSeconds: number; startingCash: number }>,
  ) => void;

  startGame: () => void;
  advancePhase: () => void;

  placeOrder: (req: OrderRequest) => void;
  setReady: (ready: boolean) => void;

  resetToLobby: () => void;
  pushToast: (text: string, kind?: 'info' | 'error') => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 1;

export const useGame = create<GameState>((set, get) => ({
  screen: 'splash',
  room: null,
  selfId: null,
  toasts: [],

  goToSplash: () => set({ screen: 'splash' }),
  goToJoin: () => set({ screen: 'join' }),
  goToHostConfig: () => set({ screen: 'host-config' }),

  createOfflineRoom: (host, overrides = {}) => {
    const config = makeConfig(newRoomSeed(), overrides);
    const room = makeRoom(config, host);
    set({ room, selfId: host.id, screen: 'lobby' });
  },

  startGame: () => {
    const { room } = get();
    if (!room) return;
    const next = startGame(room);
    set({ room: next, screen: 'round' });
  },

  advancePhase: () => {
    const { room } = get();
    if (!room) return;
    const next = advancePhase(room);
    if (next.phase === 'gameover') {
      set({ room: next, screen: 'gameover' });
    } else {
      set({ room: next });
    }
  },

  placeOrder: (req) => {
    const { room, pushToast } = get();
    if (!room) return;
    const result = placeOrder(room, req);
    if (result.error) {
      pushToast(result.error, 'error');
      return;
    }
    set({ room: result.room });
  },

  setReady: (ready) => {
    const { room, selfId } = get();
    if (!room || !selfId) return;
    set({ room: setReady(room, selfId, ready) });
  },

  resetToLobby: () => {
    const { room, selfId } = get();
    if (!room || !selfId) return;
    const host = room.players[selfId];
    if (!host) return;
    const config = makeConfig(newRoomSeed(), {
      totalRounds: room.config.totalRounds,
      tradingSeconds: room.config.tradingSeconds,
      startingCash: room.config.startingCash,
    });
    let nextRoom = makeRoom(config, { id: host.id, name: host.name, emoji: host.emoji });
    for (const p of Object.values(room.players)) {
      if (p.id !== host.id) nextRoom = addPlayer(nextRoom, p);
    }
    set({ room: nextRoom, screen: 'lobby' });
  },

  pushToast: (text, kind = 'info') => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 2500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
