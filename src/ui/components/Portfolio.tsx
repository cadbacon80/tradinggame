import type { Player, Room } from '../../game/types';
import { netWorth } from '../../game/types';

interface Props {
  room: Room;
  player: Player;
}

export function Portfolio({ room, player }: Props) {
  const positions = room.config.tickers
    .map((t) => ({
      ticker: t,
      qty: player.holdings[t.id] ?? 0,
      price: room.market.prices[t.id] ?? 0,
    }))
    .filter((p) => p.qty > 0);

  const insUnits = player.insurance;
  const insPrice = room.market.insurancePrice;
  const nw = netWorth(player, room.market);

  // Net cash this round = sum of executed sells − buys placed during this round.
  const myRoundOrders = room.pendingOrders.filter(
    (o) => o.round === room.round && o.playerId === player.id,
  );
  const netCashThisRound = myRoundOrders.reduce((sum, o) => {
    const sign = o.side === 'buy' ? -1 : 1;
    return sum + sign * o.qty * o.executedPrice;
  }, 0);

  // Net worth delta vs. end of last round.
  let nwDelta: number | null = null;
  if (room.history.length > 0) {
    const last = room.history[room.history.length - 1]!;
    const myLast = last.leaderboard.find((e) => e.playerId === player.id);
    if (myLast) nwDelta = nw - myLast.netWorth;
  }

  const stockValue = positions.reduce((a, p) => a + p.qty * p.price, 0);
  const insValue = insUnits * insPrice;

  return (
    <div className="card">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">Cash</div>
          <div className="tabular text-2xl font-bold">{player.cash}</div>
          {netCashThisRound !== 0 && (
            <div
              className={
                'tabular text-xs font-semibold ' +
                (netCashThisRound < 0 ? 'text-red-400' : 'text-green-400')
              }
            >
              {netCashThisRound < 0 ? '−' : '+'}
              {Math.abs(netCashThisRound)} this round
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-slate-500">Net worth</div>
          <div className="tabular text-2xl font-bold text-green-300">{nw}</div>
          {nwDelta !== null && nwDelta !== 0 && (
            <div
              className={
                'tabular text-xs font-semibold ' +
                (nwDelta < 0 ? 'text-red-400' : 'text-green-400')
              }
            >
              {nwDelta > 0 ? '▲' : '▼'} {Math.abs(nwDelta)} last round
            </div>
          )}
        </div>
      </div>

      {(positions.length > 0 || insUnits > 0) ? (
        <div className="mt-3 border-t border-slate-800 pt-3">
          <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">
            Positions · stocks {stockValue}{insUnits > 0 ? ` · ins ${insValue}` : ''}
          </div>
          <ul className="flex flex-col gap-1">
            {positions.map((p) => (
              <li key={p.ticker.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-base">{p.ticker.emoji}</span>
                  <span className="font-semibold tracking-wide">{p.ticker.id}</span>
                  <span className="text-slate-400">{p.qty} sh × {p.price}</span>
                </span>
                <span className="tabular font-semibold text-slate-200">{p.qty * p.price}</span>
              </li>
            ))}
            {insUnits > 0 && (
              <li className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <span className="font-semibold tracking-wide">INS</span>
                  <span className="text-slate-400">{insUnits} u × {insPrice}</span>
                </span>
                <span className="tabular font-semibold text-slate-200">{insValue}</span>
              </li>
            )}
          </ul>
        </div>
      ) : (
        <div className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
          No positions yet. Tap <span className="text-green-400 font-semibold">BUY</span> on a stock to start.
        </div>
      )}
    </div>
  );
}
