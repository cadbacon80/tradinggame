import type { Player, Room, TickerConfig } from '../../game/types';

const SECTOR_BG: Record<string, string> = {
  space:    'bg-indigo-500',
  tech:     'bg-cyan-500',
  comms:    'bg-orange-500',
  banks:    'bg-emerald-500',
  metals:   'bg-yellow-500',
  energy:   'bg-red-500',
  consumer: 'bg-amber-500',
  pets:     'bg-pink-500',
  biotech:  'bg-teal-500',
};

interface Props {
  room: Room;
  ticker: TickerConfig;
  player: Player;
  canTrade: boolean;
  onBuy: () => void;
  onSell: () => void;
  onInfo?: () => void;
}

export function StockRow({ room, ticker, player, canTrade, onBuy, onSell, onInfo }: Props) {
  const price = room.market.prices[ticker.id] ?? 0;
  const held = player.holdings[ticker.id] ?? 0;
  const lot = room.config.lotSize;
  const buyCost = price * lot;
  const canBuy = canTrade && player.cash >= buyCost;
  const canSell = canTrade && held >= lot;

  // Most recent price tick (the resolution that just finished).
  let delta = 0;
  if (room.history.length > 0) {
    const last = room.history[room.history.length - 1]!;
    const prev = last.pricesBefore[ticker.id] ?? price;
    delta = price - prev;
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-3 text-left"
          onClick={onInfo}
        >
          <span
            className={
              'flex h-10 w-10 items-center justify-center rounded-xl text-xl ' +
              (SECTOR_BG[ticker.sector] ?? 'bg-slate-700')
            }
          >
            {ticker.emoji}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">{ticker.id}</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                {ticker.sector}
              </span>
            </div>
            <div className="text-xs text-slate-400">{ticker.name}</div>
          </div>
        </button>
        <div className="text-right">
          <div className="tabular text-2xl font-bold">{price}</div>
          {delta !== 0 && (
            <div className={'tabular text-xs ' + (delta > 0 ? 'text-green-400' : 'text-red-400')}>
              {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
            </div>
          )}
        </div>
      </div>
      {held > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs">
          <span className="text-slate-400">You own</span>
          <span className="tabular font-semibold text-slate-100">
            {held} sh · {held * price}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <button
          disabled={!canSell}
          onClick={onSell}
          className="flex-1 rounded-xl bg-red-500/15 px-3 py-2 text-sm font-bold text-red-400 active:scale-95 disabled:opacity-30 disabled:active:scale-100"
        >
          SELL {lot}
        </button>
        <button
          disabled={!canBuy}
          onClick={onBuy}
          className="flex-1 rounded-xl bg-green-500/20 px-3 py-2 text-sm font-bold text-green-400 active:scale-95 disabled:opacity-30 disabled:active:scale-100"
        >
          BUY {lot}
        </button>
      </div>
    </div>
  );
}
