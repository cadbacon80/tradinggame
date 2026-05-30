import { useGame } from '../../state/gameStore';

export function Lobby() {
  const { room, selfId, startGame, goToSplash } = useGame();
  if (!room || !selfId) return null;
  const isHost = room.hostId === selfId;
  const players = Object.values(room.players);

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <button className="btn-ghost" onClick={goToSplash}>← Leave</button>
        <h1 className="text-xl font-bold">Lobby</h1>
        <div className="w-16" />
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="text-sm text-slate-400">Room code</div>
        <div className="text-6xl font-black tracking-[0.3em] tabular text-green-400">{room.id}</div>
        <div className="mt-1 text-xs text-slate-500">
          Offline mode — solo + pass-the-phone play
        </div>
      </div>

      <div className="mt-8">
        <div className="text-sm text-slate-400 mb-2">Players ({players.length})</div>
        <ul className="flex flex-col gap-2">
          {players.map((p) => (
            <li key={p.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{p.emoji}</span>
                <div>
                  <div className="font-semibold">{p.name}</div>
                  {p.id === room.hostId && (
                    <div className="text-xs text-green-400">host</div>
                  )}
                </div>
              </div>
              {p.id === selfId && (
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">you</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-8">
        {isHost ? (
          <button className="btn-primary w-full text-lg" onClick={startGame}>
            Start game
          </button>
        ) : (
          <div className="text-center text-sm text-slate-400">Waiting for host…</div>
        )}
      </div>
    </div>
  );
}
