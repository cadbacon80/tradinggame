import { useEffect } from 'react';
import { useGame } from './state/gameStore';
import { Splash } from './ui/screens/Splash';
import { Join } from './ui/screens/Join';
import { HostConfig } from './ui/screens/HostConfig';
import { Lobby } from './ui/screens/Lobby';
import { Round } from './ui/screens/Round';
import { GameOver } from './ui/screens/GameOver';

export default function App() {
  const { screen, toasts, dismissToast } = useGame();

  useEffect(() => {
    // Prevent pull-to-refresh confusion on mobile.
    const stop = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest('[data-allow-scroll]')) return;
      // allow normal scrolling
    };
    document.addEventListener('touchmove', stop, { passive: true });
    return () => document.removeEventListener('touchmove', stop);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {screen === 'splash' && <Splash />}
      {screen === 'join' && <Join />}
      {screen === 'host-config' && <HostConfig />}
      {screen === 'lobby' && <Lobby />}
      {screen === 'round' && <Round />}
      {screen === 'gameover' && <GameOver />}

      <div className="pointer-events-none fixed bottom-6 left-0 right-0 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={
              'pointer-events-auto rounded-xl px-4 py-2 text-sm shadow-lg ' +
              (t.kind === 'error'
                ? 'bg-red-500 text-slate-950'
                : 'bg-slate-800 text-slate-100')
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
