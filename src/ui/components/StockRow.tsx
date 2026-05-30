import type { Player, Room, TickerConfig } from '../../game/types';

const SECTOR_DOT: Record<string, string> = {
  consumer: 'bg-amber-400',
  pets: 'bg-pink-400',
  space: 'bg-indigo-400',
  biotech: 'bg-teal-400',
  energy: 'bg-lime-400',
};

interface Props {
  room: Room;
  ticker: TickerConfig;
  player: Player;
  canTrade: boolean;
  onBuy: () => void;
  onSell: () => void;
}

export function StockRow({ room, ticker, player, canTrade, onBuy, onSell }: Props) {
  const price = room.market.prices[ticker.id] ?? 0;
  const held = player.holdings[ticker.id] ?? 0;
  const lot = room.config.lotSize;
  const buyCost = price * lot;
  const canBuy = canTrade && player.cash >= buyCost;
  const canSell = canTrade && held >= lot;

  // Find last price tick from history for a tiny delta indicator.
  let delta = 0;
  if (room.history.length > 0) {
    const last = room.history[room.history.length - 1]!;
    const prev = last.pricesBefore[ticker.id] ?? price;
    delta = price - prev;
  }

  return (
    <div className="card flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={'h-2.5 w-2.5 rounded-full ' + (SECTOR_DOT[ticker.sector] ?? 'bg-slate-500')} />
        <div>
          <div className="font-bold tracking-wide">{ticker.id}</div>
          <div className="text-xs text-slate-400">{ticker.name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="tabular text-xl font-bold">{price}</div>
        {delta !== 0 && (
          <div className={'tabular text-xs ' + (delta > 0 ? 'text-green-400' : 'text-red-400')}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="tabular text-xs text-slate-400">{held} sh</div>
        <div className="flex gap-1">
          <button
            disabled={!canSell}
            onClick={onSell}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-red-400 disabled:opacity-30"
          >
            −{lot}
          </button>
          <button
            disabled={!canBuy}
            onClick={onBuy}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-green-400 disabled:opacity-30"
          >
            +{lot}
          </button>
        </div>
      </div>
    </div>
  );
}
