import { cn } from "cn";
import type { ReactNode } from "react";
import { DoodleSparkle } from "@/components/ui/doodles";

type EmptyStateProps = {
  /** A doodle or small illustration; defaults to the sparkle. */
  art?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Usually a Button that gets the person unstuck. */
  action?: ReactNode;
  className?: string;
};

// What a list or panel shows when there's nothing in it yet (no saved
// providers, no requests, an empty verification queue…). Always says what
// would appear here and offers one way forward.
export function EmptyState({ art, title, children, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-card border border-dashed border-warm-300 bg-warm-50/60 px-6 py-12 text-center sm:py-16",
        className,
      )}
    >
      <div aria-hidden className="flex size-16 items-center justify-center rounded-full bg-white text-warm-700 shadow-control">
        {art ?? <DoodleSparkle className="size-8" />}
      </div>
      <div className="flex max-w-[420px] flex-col gap-1.5">
        <h3 className="type-title text-text-primary">{title}</h3>
        {children && <p className="type-body text-text-tertiary">{children}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
