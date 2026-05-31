import type { Room } from '../../game/types';
import { computeMood, computeWhisper } from '../../game/mood';

export function MarketMood({ room }: { room: Room }) {
  const mood = computeMood(room);
  const whisper = computeWhisper(room);

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="text-3xl leading-none">{mood.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold tracking-wide">{mood.label}</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
              market mood
            </span>
          </div>
          <div className="text-xs text-slate-400">{mood.description}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-200">
        🛡️ <span className="text-slate-400">{mood.shieldHint}</span>
      </div>
      {whisper && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs">
          <span className="text-base leading-none">{whisper.emoji}</span>
          <span className="text-slate-300">
            <span className="font-semibold text-amber-300">Whisper · next round:</span>{' '}
            {whisper.text}
          </span>
        </div>
      )}
    </div>
  );
}
