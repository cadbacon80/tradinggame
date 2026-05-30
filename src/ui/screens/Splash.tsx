import { useGame } from '../../state/gameStore';

export function Splash() {
  const { goToHostConfig, goToJoin } = useGame();
  return (
    <div className="flex min-h-screen flex-col items-center justify-between px-6 py-12">
      <div className="mt-10 flex flex-col items-center gap-2">
        <div className="text-6xl">🐂</div>
        <h1 className="text-5xl font-black tracking-tight">Bull Run</h1>
        <p className="text-sm text-slate-400">A 10-minute trading game for 2–8 phones.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button className="btn-primary text-lg" onClick={goToHostConfig}>
          Create game
        </button>
        <button className="btn-secondary text-lg" onClick={goToJoin}>
          Join game
        </button>
      </div>

      <div className="text-xs text-slate-500">v0.0.1 · offline mode</div>
    </div>
  );
}
