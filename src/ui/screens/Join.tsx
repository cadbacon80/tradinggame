import { useState } from 'react';
import { useGame } from '../../state/gameStore';
import { usePlayer } from '../../state/playerStore';

const EMOJIS = ['🐱','🐶','🦊','🐼','🐸','🐙','🦄','🐝','🦖','🐢','🐧','🦔','🦦','🐹','🦇','🦋','🦩','🌶️','🥑','🥨','🍿','🌮','🍣','🥑'];

export function Join() {
  const [code, setCode] = useState('');
  const { name, emoji, setIdentity } = usePlayer();
  const [localName, setLocalName] = useState(name);
  const [localEmoji, setLocalEmoji] = useState(emoji);
  const { goToSplash, pushToast } = useGame();

  function submit() {
    if (!localName.trim()) {
      pushToast('Pick a name', 'error');
      return;
    }
    if (code.length !== 4) {
      pushToast('Code must be 4 letters', 'error');
      return;
    }
    setIdentity(localName.trim().slice(0, 12), localEmoji);
    pushToast('Online multiplayer is not configured in this build yet.');
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <button className="btn-ghost" onClick={goToSplash}>← Back</button>
        <h1 className="text-xl font-bold">Join a game</h1>
        <div className="w-16" />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Room code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
            maxLength={4}
            inputMode="text"
            autoCapitalize="characters"
            placeholder="ABCD"
            className="rounded-xl bg-slate-900 px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] tabular focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Your name</span>
          <input
            value={localName}
            onChange={(e) => setLocalName(e.target.value.slice(0, 12))}
            placeholder="Trader"
            className="rounded-xl bg-slate-900 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </label>

        <div>
          <div className="text-sm text-slate-400 mb-2">Pick an emoji</div>
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

        <button className="btn-primary text-lg" onClick={submit}>
          Join
        </button>
      </div>
    </div>
  );
}
