import type { NewsItem } from '../../game/types';

export function NewsCard({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <div className="card text-sm text-slate-400">
        Quiet on the wires…
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.id} className="card flex items-start gap-3">
          <div className="text-3xl">{item.emoji}</div>
          <div className="flex-1 text-sm leading-snug">{item.headline}</div>
        </div>
      ))}
    </div>
  );
}
