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

  const upcoming = room.config.insuranceRounds.find((r) => r > room.round);
  const helper = open
    ? 'Window is OPEN this round'
    : upcoming
      ? `Window opens round ${upcoming}`
      : 'No more windows this game';

  return (
    <div
      className={
        'card flex flex-col gap-3 ' +
        (open ? 'ring-2 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.25)]' : '')
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-xl">
            🛡️
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">INS</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                vol
              </span>
            </div>
            <div className="text-xs text-slate-400">Pops on big swings</div>
          </div>
        </div>
        <div className="text-right">
          <div className="tabular text-2xl font-bold">{price}</div>
          <div className="tabular text-xs text-slate-500">{held} units</div>
        </div>
      </div>
      <div className={'text-xs ' + (open ? 'text-amber-300' : 'text-slate-500')}>
        {helper}
      </div>
      {held > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs">
          <span className="text-slate-400">You hold</span>
          <span className="tabular font-semibold text-slate-100">
            {held} u · {held * price}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <button
          disabled={!canSell}
          onClick={onSell}
          className="flex-1 rounded-xl bg-red-500/15 px-3 py-2 text-sm font-bold text-red-400 active:scale-95 disabled:opacity-30 disabled:active:scale-100"
        >
          SELL 1
        </button>
        <button
          disabled={!canBuy}
          onClick={onBuy}
          className="flex-1 rounded-xl bg-amber-500/25 px-3 py-2 text-sm font-bold text-amber-300 active:scale-95 disabled:opacity-30 disabled:active:scale-100"
        >
          BUY 1
        </button>
      </div>
    </div>
  );
}
