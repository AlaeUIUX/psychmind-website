import { formatCount } from "@/lib/analytics/format";

// A ranked list, one thin bar per row (Figma D1 "How patients found you").
// One series, so every bar is the same blue; the value is printed on each
// row, so nothing depends on hovering or on colour.

export function BarList({ items, label }: { items: { label: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ol aria-label={label} className="flex flex-col gap-3.5">
      {items.map((item) => (
        <li key={item.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <span title={item.label} className="min-w-0 truncate type-ui-small text-text-secondary">
              {item.label}
            </span>
            <span className="shrink-0 type-ui-small font-medium text-text-primary tabular-nums">{formatCount(item.count)}</span>
          </div>
          <div aria-hidden className="h-1.5 overflow-hidden rounded-r-sm bg-warm-100">
            <div className="h-full rounded-r-sm bg-(--chart-1)" style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
