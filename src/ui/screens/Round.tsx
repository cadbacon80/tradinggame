import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/gameStore';
import { PhaseHeader } from '../components/PhaseHeader';
import { NewsCard } from '../components/NewsCard';
import { StockRow } from '../components/StockRow';
import { InsuranceCard } from '../components/InsuranceCard';
import { Leaderboard } from '../components/Leaderboard';
import { netWorth } from '../../game/types';

export function Round() {
  const { room, selfId, placeOrder, setReady, advancePhase } = useGame();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const phaseRef = useRef<{ phase: string; endsAt: number } | null>(null);

  useEffect(() => {
    if (!room) return;
    if (phaseRef.current?.endsAt === room.phaseEndsAt && phaseRef.current?.phase === room.phase) return;
    phaseRef.current = { phase: room.phase, endsAt: room.phaseEndsAt };

    const delay = Math.max(0, room.phaseEndsAt - Date.now());
    const t = setTimeout(() => advancePhase(), delay + 50);
    return () => clearTimeout(t);
  }, [room?.phase, room?.phaseEndsAt, advancePhase, room]);

  if (!room || !selfId) return null;
  const player = room.players[selfId];
  if (!player) return null;

  const canTrade = room.phase === 'trading';
  const myNet = netWorth(player, room.market);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-32" data-allow-scroll>
      <PhaseHeader room={room} />

      <NewsCard items={room.market.currentNews} />

      <div className="mt-4 flex flex-col gap-2">
        {room.config.tickers.map((t) => (
          <StockRow
            key={t.id}
            room={room}
            ticker={t}
            player={player}
            canTrade={canTrade}
            onBuy={() => placeOrder({ playerId: selfId, kind: 'stock', ticker: t.id, side: 'buy' })}
            onSell={() => placeOrder({ playerId: selfId, kind: 'stock', ticker: t.id, side: 'sell' })}
          />
        ))}
      </div>

      <div className="mt-4">
        <InsuranceCard
          room={room}
          player={player}
          canTrade={canTrade}
          onBuy={() => placeOrder({ playerId: selfId, kind: 'insurance', side: 'buy' })}
          onSell={() => placeOrder({ playerId: selfId, kind: 'insurance', side: 'sell' })}
        />
      </div>

      {showLeaderboard && (
        <div className="mt-4">
          <Leaderboard room={room} selfId={selfId} />
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-3">
          <button
            className="flex flex-col items-start text-left"
            onClick={() => setShowLeaderboard((v) => !v)}
          >
            <span className="text-xs text-slate-400">Cash</span>
            <span className="tabular text-xl font-bold">{player.cash}</span>
          </button>
          <button
            className="flex flex-col items-center"
            onClick={() => setShowLeaderboard((v) => !v)}
          >
            <span className="text-xs text-slate-400">Net worth</span>
            <span className="tabular text-xl font-bold text-green-300">{myNet}</span>
          </button>
          {canTrade ? (
            <button
              className={
                'rounded-xl px-3 py-2 text-sm font-semibold ' +
                (player.ready ? 'bg-green-500 text-slate-950' : 'bg-slate-800 text-slate-100')
              }
              onClick={() => setReady(!player.ready)}
            >
              {player.ready ? '✓ Ready' : 'Ready'}
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </footer>
    </div>
  );
}
