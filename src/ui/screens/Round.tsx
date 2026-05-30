import { useEffect, useState } from 'react';
import { useGame } from '../../state/gameStore';
import { PhaseHeader } from '../components/PhaseHeader';
import { NewsCard } from '../components/NewsCard';
import { Portfolio } from '../components/Portfolio';
import { StockRow } from '../components/StockRow';
import { InsuranceCard } from '../components/InsuranceCard';
import { Leaderboard } from '../components/Leaderboard';
import { netWorth, type TickerConfig } from '../../game/types';

export function Round() {
  const { room, selfId, placeOrder, setReady, advancePhase } = useGame();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [dismissedTutorial, setDismissedTutorial] = useState(false);
  const [infoTicker, setInfoTicker] = useState<TickerConfig | null>(null);

  const phase = room?.phase;
  const phaseEndsAt = room?.phaseEndsAt;

  useEffect(() => {
    if (!phase || !phaseEndsAt) return;
    if (phase === 'lobby' || phase === 'gameover') return;
    const delay = Math.max(0, phaseEndsAt - Date.now());
    const t = setTimeout(() => advancePhase(), delay + 50);
    return () => clearTimeout(t);
  }, [phase, phaseEndsAt, advancePhase]);

  if (!room || !selfId) return null;
  const player = room.players[selfId];
  if (!player) return null;

  const canTrade = room.phase === 'trading';
  const myNet = netWorth(player, room.market);
  const showTutorial = !dismissedTutorial && room.round === 1;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-32" data-allow-scroll>
      <PhaseHeader room={room} onHelp={() => setShowHelp(true)} />

      <NewsCard items={room.market.currentNews} />

      <div className="mt-3">
        <Portfolio room={room} player={player} />
      </div>

      {showTutorial && (
        <div className="mt-3 rounded-2xl border border-amber-400/40 bg-amber-400/5 p-3 text-sm leading-snug">
          <div className="mb-1 font-semibold text-amber-300">How to play</div>
          <ul className="ml-4 list-disc space-y-1 text-slate-200">
            <li>News drops → wait → trading opens.</li>
            <li>Tap <span className="rounded bg-green-500 px-1.5 font-bold text-slate-950">BUY 5</span> to buy 5 shares, <span className="rounded bg-red-500 px-1.5 font-bold text-slate-50">SELL 5</span> to sell 5.</li>
            <li>You trade at the price shown. Prices update after the round.</li>
            <li>Insurance (INS) goes up on any big move and bleeds in calm rounds.</li>
          </ul>
          <button
            className="mt-2 text-xs text-amber-300 underline"
            onClick={() => setDismissedTutorial(true)}
          >
            Got it, hide this
          </button>
        </div>
      )}

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
            onInfo={() => setInfoTicker(t)}
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
              {player.ready ? '✓ Ready' : 'Done'}
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </footer>

      {infoTicker && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-black/60"
          onClick={() => setInfoTicker(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-slate-900 p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                {infoTicker.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold tracking-wide">{infoTicker.id}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                    {infoTicker.sector}
                  </span>
                </div>
                <div className="text-sm text-slate-400">{infoTicker.name}</div>
              </div>
              <button onClick={() => setInfoTicker(null)} className="text-slate-400">✕</button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">{infoTicker.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-slate-400">Price</div>
                <div className="tabular text-lg font-semibold">{room.market.prices[infoTicker.id] ?? 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">You own</div>
                <div className="tabular text-lg font-semibold">{player.holdings[infoTicker.id] ?? 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Lot</div>
                <div className="tabular text-lg font-semibold">{room.config.lotSize}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-black/60"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-slate-900 p-6 pb-10 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">How to play</h2>
              <button onClick={() => setShowHelp(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-3 leading-snug">
              <div>
                <div className="font-semibold text-slate-100">Each round has 3 phases:</div>
                <ol className="ml-4 mt-1 list-decimal text-slate-300 space-y-0.5">
                  <li><b>News</b> ({room.config.newsRevealSeconds}s) — read what's happening.</li>
                  <li><b>Trading</b> ({room.config.tradingSeconds}s) — buy or sell.</li>
                  <li><b>Resolving</b> — prices update based on the news.</li>
                </ol>
              </div>
              <div>
                <div className="font-semibold text-slate-100">Stocks</div>
                <p className="mt-1 text-slate-300">
                  Trade in lots of {room.config.lotSize}. Buy if you think the news will push the price up; sell if you think it'll fall.
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-100">Insurance (INS)</div>
                <p className="mt-1 text-slate-300">
                  A volatility bet. It rises on any big move (up or down) and bleeds when the market is quiet. Only tradable on specific rounds — those rounds glow.
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-100">Winning</div>
                <p className="mt-1 text-slate-300">
                  After the final round, highest net worth (cash + your stocks + your INS) wins.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
