import { create } from 'zustand';

interface PlayerState {
  id: string;
  name: string;
  emoji: string;
  setIdentity: (name: string, emoji: string) => void;
}

function makeId(): string {
  return `p-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function load() {
  try {
    const raw = localStorage.getItem('bullrun.player');
    if (!raw) return null;
    return JSON.parse(raw) as { id: string; name: string; emoji: string };
  } catch {
    return null;
  }
}

const initial = load();

export const usePlayer = create<PlayerState>((set) => ({
  id: initial?.id ?? makeId(),
  name: initial?.name ?? '',
  emoji: initial?.emoji ?? '🦊',
  setIdentity: (name, emoji) => {
    set((s) => {
      const next = { id: s.id, name, emoji };
      try {
        localStorage.setItem('bullrun.player', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  },
}));
