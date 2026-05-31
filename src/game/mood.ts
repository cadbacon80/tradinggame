import type { Room } from './types';
import { RNG } from './rng';
import { sampleNews } from './news';

export type MoodKey = 'opening' | 'calm' | 'steady' | 'choppy' | 'rally' | 'crash' | 'wild';

export interface Mood {
  key: MoodKey;
  label: string;
  emoji: string;
  /** One-line read on what just happened. */
  description: string;
  /** Contextual SHIELD advice. */
  shieldHint: string;
}

/** Read the last round's price action and return a kid-friendly mood label. */
export function computeMood(room: Room): Mood {
  if (room.history.length === 0) {
    return {
      key: 'opening',
      label: 'Opening bell',
      emoji: '🔔',
      description: 'Nothing has happened yet — guess wisely.',
      shieldHint:
        'SHIELD starts at fair value. Worth a unit if you think round 1 will be loud.',
    };
  }

  const last = room.history[room.history.length - 1]!;
  const returns: number[] = [];
  for (const t of room.config.tickers) {
    const before = last.pricesBefore[t.id];
    const after = last.pricesAfter[t.id];
    if (before == null || after == null) continue;
    returns.push((after - before) / before);
  }
  const avg = returns.reduce((a, b) => a + b, 0) / Math.max(1, returns.length);
  const meanAbs = returns.reduce((a, b) => a + Math.abs(b), 0) / Math.max(1, returns.length);

  let key: MoodKey;
  let label: string;
  let emoji: string;
  let description: string;

  if (meanAbs > 0.04) {
    if (avg > 0.02) {
      key = 'rally'; emoji = '🚀'; label = 'Roaring rally';
      description = 'Stocks ripped higher across the board.';
    } else if (avg < -0.02) {
      key = 'crash'; emoji = '💥'; label = 'Crashing';
      description = 'Sea of red on the tape.';
    } else {
      key = 'wild'; emoji = '🌪️'; label = 'Wild swings';
      description = 'Big moves in both directions.';
    }
  } else if (meanAbs > 0.02) {
    if (avg > 0.01) {
      key = 'rally'; emoji = '🐂'; label = 'Bullish';
      description = 'Most stocks up, nothing crazy.';
    } else if (avg < -0.01) {
      key = 'crash'; emoji = '🐻'; label = 'Bearish';
      description = 'Most stocks down, nothing crazy.';
    } else {
      key = 'choppy'; emoji = '🌊'; label = 'Choppy';
      description = 'Mixed moves, no clear direction.';
    }
  } else if (meanAbs > 0.01) {
    key = 'steady'; emoji = '😐'; label = 'Steady';
    description = 'Small moves all around.';
  } else {
    key = 'calm'; emoji = '😴'; label = 'Calm';
    description = 'Markets are barely awake.';
  }

  const insStart = room.config.insurance.startPrice;
  const insNow = room.market.insurancePrice;
  const cheap = insNow < insStart * 0.85;
  const pricey = insNow > insStart * 1.15;

  let shieldHint: string;
  if (key === 'calm' || key === 'steady') {
    shieldHint = cheap
      ? 'SHIELD is cheap. Decent punt if you expect noise.'
      : 'SHIELD bleeds in quiet rounds. Only hold if you expect a surprise.';
  } else if (key === 'wild' || key === 'rally' || key === 'crash') {
    shieldHint = pricey
      ? 'SHIELD already popped. Probably overpriced now.'
      : 'SHIELD likely to keep moving while the market is loud.';
  } else {
    shieldHint = 'SHIELD around fair value. Wait for a clearer signal.';
  }

  return { key, label, emoji, description, shieldHint };
}

export interface Whisper {
  text: string;
  emoji: string;
}

/**
 * Peek at the next round's news and return a vague forward-looking hint.
 * Sector is revealed; direction and ticker are not — so the player can plan
 * without the news being pre-spoiled.
 */
export function computeWhisper(room: Room): Whisper | null {
  if (room.status !== 'playing') return null;
  if (room.round <= 0) return null;
  if (room.round >= room.config.totalRounds) return null;

  const usedSet = new Set<string>();
  for (const snap of room.history) for (const n of snap.news) usedSet.add(n.id);
  for (const n of room.market.currentNews) usedSet.add(n.id);

  const rng = new RNG(`${room.config.seed}:${room.round + 1}:news`);
  const nextNews = sampleNews(
    rng,
    room.round + 1,
    room.config.totalRounds,
    room.config.insuranceRounds,
    usedSet,
  );

  if (nextNews.length === 0) return { text: 'Quiet wires expected.', emoji: '🤫' };

  const sectors = new Set<string>();
  let marketWide = false;
  let anyEffect = false;

  for (const item of nextNews) {
    for (const e of item.effects) {
      anyEffect = true;
      if (e.target === 'market') {
        marketWide = true;
      } else if ('ticker' in e.target) {
        const targetTicker = e.target.ticker;
        const t = room.config.tickers.find((x) => x.id === targetTicker);
        if (t) sectors.add(t.sector);
      } else if ('sector' in e.target) {
        sectors.add(e.target.sector);
      }
    }
  }

  if (!anyEffect) return { text: 'Looks like fluff next round.', emoji: '💭' };
  if (marketWide && sectors.size === 0) return { text: 'Broad market news ahead.', emoji: '📣' };
  if (sectors.size > 1) return { text: 'Multiple sectors in play next round.', emoji: '🎯' };
  if (sectors.size === 1) {
    const sec = [...sectors][0];
    return { text: `Eyes on ${sec}.`, emoji: '👀' };
  }
  return { text: 'Something is brewing…', emoji: '💭' };
}
