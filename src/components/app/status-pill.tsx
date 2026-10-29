import { cn } from "cn";
import type { ReactNode } from "react";

// A status in a table or header (waiting for review, verified, rejected…): a
// neutral grey pill, the state told by a small dot. Amber is waiting or needs
// action, green done, red refused or broken, sky in progress, grey idle.
// Badge keeps the coloured fills for other uses (deltas, "New").

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

const DOT: Record<StatusTone, string> = {
  neutral: "bg-warm-400",
  info: "bg-sky-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  danger: "bg-red-500",
};

export function StatusPill({ tone = "neutral", dot = true, children, className }: { tone?: StatusTone; /** Off for plain tags ("Sample"). */ dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-pill border border-warm-900/10 bg-warm-900/[0.03] px-2 text-xs leading-4 font-medium whitespace-nowrap text-warm-900/70",
        className,
      )}
    >
      {dot && <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])} />}
      {children}
    </span>
  );
}
