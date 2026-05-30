import { useState } from 'react';
import { useGame } from '../../state/gameStore';
import { usePlayer } from '../../state/playerStore';

const EMOJIS = ['🐱','🐶','🦊','🐼','🐸','🐙','🦄','🐝','🦖','🐢','🐧','🦔','🦦','🐹','🦇','🦋','🦩','🌶️','🥑','🥨','🍿','🌮','🍣','🐂'];

export function HostConfig() {
  const { goToSplash, createOfflineRoom, pushToast } = useGame();
  const { id, name, emoji, setIdentity } = usePlayer();
  const [localName, setLocalName] = useState(name);
  const [localEmoji, setLocalEmoji] = useState(emoji);
  const [rounds, setRounds] = useState(8);
  const [tradingSeconds, setTradingSeconds] = useState(30);

  function create() {
    const trimmed = localName.trim() || 'Host';
    setIdentity(trimmed.slice(0, 12), localEmoji);
    createOfflineRoom(
      { id, name: trimmed.slice(0, 12), emoji: localEmoji },
      { totalRounds: rounds, tradingSeconds },
    );
    pushToast(`Room ready. ${rounds} rounds, ${tradingSeconds}s trading.`);
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <button className="btn-ghost" onClick={goToSplash}>← Back</button>
        <h1 className="text-xl font-bold">New game</h1>
        <div className="w-16" />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Host name</span>
          <input
            value={localName}
            onChange={(e) => setLocalName(e.target.value.slice(0, 12))}
            placeholder="Host"
            className="rounded-xl bg-slate-900 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </label>

        <div>
          <div className="text-sm text-slate-400 mb-2">Your emoji</div>
          <div className="grid grid-cols-8 gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className={
                  'aspect-square rounded-xl text-2xl ' +
                  (localEmoji === e ? 'bg-green-500' : 'bg-slate-900')
                }
                onClick={() => setLocalEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-400">Rounds</span>
            <span className="tabular text-lg font-semibold">{rounds}</span>
          </div>
          <input
            type="range"
            min={5}
            max={10}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-400">Trading seconds</span>
            <span className="tabular text-lg font-semibold">{tradingSeconds}s</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45].map((s) => (
              <button
                key={s}
                className={
                  'btn ' + (tradingSeconds === s ? 'bg-green-500 text-slate-950' : 'bg-slate-900 text-slate-100')
                }
                onClick={() => setTradingSeconds(s)}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary text-lg" onClick={create}>
          Create room
        </button>
      </div>
    </div>
  );
}
