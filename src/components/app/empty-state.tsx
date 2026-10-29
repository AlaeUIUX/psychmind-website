import { cn } from "cn";
import type { ReactNode } from "react";
import { frame, frameCard, frameColumn } from "@/components/home/search-styles";

type EmptyStateProps = {
  /** An icon for the first row's tile (Hugeicons), saying what the list holds. */
  art?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Usually a Button that gets the person unstuck. */
  action?: ReactNode;
  className?: string;
};

/** A picture of the list that isn't there yet: grey rows of the app's own UI,
 *  each fainter than the last, on a grey column. No doodles. */
function GhostRows({ icon }: { icon?: ReactNode }) {
  return (
    <div aria-hidden className={cn(frameColumn, "flex w-full max-w-[300px] flex-col gap-1.5 p-2")}>
      {[1, 0.55, 0.25].map((opacity, i) => (
        <div key={opacity} style={{ opacity }} className="flex items-center gap-3 rounded-[8px] border border-warm-900/[0.08] bg-white p-2 shadow-control">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-warm-900/[0.05] text-warm-900/50 [&_svg]:size-4">
            {i === 0 && icon}
          </span>
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="h-1.5 w-2/3 rounded-full bg-warm-900/10" />
            <span className="h-1.5 w-1/3 rounded-full bg-warm-900/[0.06]" />
          </span>
          <span className="h-5 w-12 shrink-0 rounded-pill border border-warm-900/[0.08]" />
        </div>
      ))}
    </div>
  );
}

// What a list or panel shows when there's nothing in it yet (no saved
// providers, no requests, no search results…). Always says what would appear
// here and offers one way forward. Built as the landing's privacy promise is:
// a grey frame, a white card, and the picture in a grey column.
export function EmptyState({ art, title, children, action, className }: EmptyStateProps) {
  return (
    <div className={cn(frame, className)}>
      <div className={cn(frameCard, "flex flex-col items-center gap-5 px-6 py-10 text-center sm:py-12")}>
        <GhostRows icon={art} />
        <div className="flex max-w-[420px] flex-col gap-1.5">
          {/* the privacy promise's title: 15px medium, nothing louder */}
          <h3 className="text-[15px] leading-5 font-medium tracking-[-0.01em] text-balance text-warm-900">{title}</h3>
          {children && <p className="text-sm leading-[22px] tracking-[-0.01em] text-warm-900/60">{children}</p>}
        </div>
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
}
