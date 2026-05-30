import { useGame } from '../../state/gameStore';
import { netWorth } from '../../game/types';

export function GameOver() {
  const { room, selfId, resetToLobby, goToSplash } = useGame();
  if (!room || !selfId) return null;

  const players = Object.values(room.players)
    .map((p) => ({ p, nw: netWorth(p, room.market) }))
    .sort((a, b) => b.nw - a.nw);

  const podium = players.slice(0, 3);
  const isHost = room.hostId === selfId;

  return (
    <div className="flex min-h-screen flex-col items-stretch px-6 py-8">
      <h1 className="text-center text-3xl font-black">🏁 Game over</h1>
      <p className="mt-1 text-center text-sm text-slate-400">
        {room.config.totalRounds} rounds done
      </p>

      <div className="mt-8 grid grid-cols-3 items-end gap-3">
        {podium.map((e, idx) => {
          const heights = ['h-32', 'h-40', 'h-24'];
          const order = [1, 0, 2]; // visual: silver, gold, bronze
          const pos = order.indexOf(idx);
          return (
            <div key={e.p.id} className="flex flex-col items-center" style={{ order: pos }}>
              <div className="text-4xl">{e.p.emoji}</div>
              <div className="text-sm font-semibold">{e.p.name}</div>
              <div className="tabular text-xs text-slate-400">{e.nw}</div>
              <div
                className={
                  'mt-2 w-full rounded-t-xl ' +
                  (idx === 0
                    ? 'bg-yellow-400 ' + heights[1]
                    : idx === 1
                      ? 'bg-slate-300 ' + heights[0]
                      : 'bg-amber-600 ' + heights[2])
                }
              >
                <div className="pt-2 text-center text-2xl font-black text-slate-950">
                  {idx + 1}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-1 text-sm">
        {players.map((e, idx) => (
          <div
            key={e.p.id}
            className={
              'flex items-center justify-between rounded-xl px-3 py-2 ' +
              (e.p.id === selfId ? 'bg-slate-800' : 'bg-slate-900')
            }
          >
            <span className="flex items-center gap-2">
              <span className="tabular w-6 text-slate-500">{idx + 1}.</span>
              <span>{e.p.emoji}</span>
              <span>{e.p.name}</span>
            </span>
            <span className="tabular font-semibold">{e.nw}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {isHost && (
          <button className="btn-primary text-lg" onClick={resetToLobby}>
            Play again
          </button>
        )}
        <button className="btn-secondary text-lg" onClick={goToSplash}>
          Leave
        </button>
      </div>
    </div>
  );
}
