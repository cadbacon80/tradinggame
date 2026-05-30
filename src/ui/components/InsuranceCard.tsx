import type { Player, Room } from '../../game/types';

interface Props {
  room: Room;
  player: Player;
  canTrade: boolean;
  onBuy: () => void;
  onSell: () => void;
}

export function InsuranceCard({ room, player, canTrade, onBuy, onSell }: Props) {
  const price = room.market.insurancePrice;
  const held = player.insurance;
  const open = room.market.insuranceWindowOpen;
  const canBuy = canTrade && open && player.cash >= price;
  const canSell = canTrade && open && held > 0;

  // Find the next round in config.insuranceRounds that's >= current round + 1
  const upcoming = room.config.insuranceRounds.find((r) => r > room.round);
  const helper = open
    ? 'Open this round'
    : upcoming
      ? `Opens round ${upcoming}`
      : 'Closed for this game';

  return (
    <div className={'card flex flex-col gap-3 ' + (open ? 'ring-2 ring-amber-400' : '')}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold tracking-wide">INS</div>
          <div className="text-xs text-slate-400">Volatility hedge</div>
        </div>
        <div className="text-right">
          <div className="tabular text-xl font-bold">{price}</div>
          <div className="tabular text-xs text-slate-400">{held} units</div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span
          className={
            'text-xs ' + (open ? 'text-amber-300' : 'text-slate-500')
          }
        >
          {helper}
        </span>
        <div className="flex gap-1">
          <button
            disabled={!canSell}
            onClick={onSell}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-red-400 disabled:opacity-30"
          >
            −1
          </button>
          <button
            disabled={!canBuy}
            onClick={onBuy}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-amber-300 disabled:opacity-30"
          >
            +1
          </button>
        </div>
      </div>
    </div>
  );
}
