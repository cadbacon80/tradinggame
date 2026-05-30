import type { Room } from '../../game/types';
import { netWorth } from '../../game/types';

export function Leaderboard({ room, selfId }: { room: Room; selfId: string }) {
  const entries = Object.values(room.players)
    .map((p) => ({ p, nw: netWorth(p, room.market) }))
    .sort((a, b) => b.nw - a.nw);

  return (
    <div className="card">
      <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Leaderboard</div>
      <ul className="flex flex-col gap-1">
        {entries.map((e, idx) => (
          <li
            key={e.p.id}
            className={
              'flex items-center justify-between text-sm ' +
              (e.p.id === selfId ? 'font-semibold text-green-300' : 'text-slate-200')
            }
          >
            <span className="flex items-center gap-2">
              <span className="tabular w-5 text-slate-500">{idx + 1}.</span>
              <span>{e.p.emoji}</span>
              <span>{e.p.name}</span>
            </span>
            <span className="tabular">{e.nw}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
