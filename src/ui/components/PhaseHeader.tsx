import { useEffect, useState } from 'react';
import type { Room } from '../../game/types';

export function PhaseHeader({ room }: { room: Room }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const secondsLeft = Math.max(0, Math.ceil((room.phaseEndsAt - now) / 1000));
  const label = room.phase === 'news'
    ? 'News'
    : room.phase === 'trading'
      ? 'Trading'
      : room.phase === 'resolving'
        ? 'Resolving'
        : '';

  const color = room.phase === 'trading'
    ? 'bg-green-500 text-slate-950'
    : room.phase === 'resolving'
      ? 'bg-indigo-500 text-slate-50'
      : 'bg-amber-400 text-slate-950';

  return (
    <header className="sticky top-0 z-10 -mx-6 mb-4 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-3">
      <div className="tabular text-sm text-slate-400">
        Round {room.round}/{room.config.totalRounds}
      </div>
      <div className={'rounded-full px-3 py-1 text-xs font-semibold ' + color}>
        {label.toUpperCase()}
      </div>
      <div className="tabular w-12 text-right text-2xl font-bold">
        {secondsLeft}s
      </div>
    </header>
  );
}
