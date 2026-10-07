import { cn } from "cn";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: ReactNode;
  /** Change vs the previous period, as a percentage (e.g. 12 or -4). */
  delta?: number;
  /** e.g. "vs last 30 days". */
  hint?: string;
  className?: string;
};

// One analytics number (impressions, profile views, saves, requests).
export function StatTile({ label, value, delta, hint, className }: StatTileProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cn("flex flex-col gap-3 rounded-card surface-soft p-5 sm:p-6", className)}>
      <p className="type-small font-medium text-text-tertiary">{label}</p>
      <p className="type-stat text-text-primary">{value}</p>
      {(delta !== undefined || hint) && (
        <p className="flex items-center gap-1.5 type-small text-text-placeholder">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                up ? "text-emerald-700" : "text-red-700",
              )}
            >
              {up ? <ArrowUpRightIcon aria-hidden className="size-3.5" /> : <ArrowDownRightIcon aria-hidden className="size-3.5" />}
              <span className="sr-only">{up ? "Up" : "Down"}</span>
              {Math.abs(delta)}%
            </span>
          )}
          {hint}
        </p>
      )}
    </div>
  );
}
