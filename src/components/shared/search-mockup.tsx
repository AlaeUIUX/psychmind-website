import { cn } from "cn";
import { SearchIcon } from "@/components/ui/icons";

// Illustrative (non-interactive) versions of the search UI, used inside the
// feature panels on Home and How it works. Everything is aria-hidden and
// unfocusable: they're pictures of the product, not controls.

/** Compact search bar: In-person/Online toggle, query, search button. */
export function SearchBarMockup({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid w-full min-w-0 grid-cols-[1fr_auto] items-center gap-2 rounded-4xl border border-warm-300 bg-warm-200 p-2 sm:flex sm:gap-3",
        className,
      )}
    >
      <div className="flex shrink-0 flex-col items-start justify-center gap-2.5 rounded-[18px] bg-warm-100 px-4 py-3 sm:py-3.5">
        <div className="flex items-center gap-3 whitespace-nowrap type-small font-medium sm:type-body sm:font-medium">
          <span className="text-text-placeholder">In-person</span>
          <span className="text-text-primary">Online</span>
        </div>
        <div className="relative h-5 w-[70px] rounded-full bg-warm-25 ring-1 ring-warm-300/60">
          <div className="absolute top-0 right-0 size-5 rounded-full bg-brand-primary shadow-control" />
        </div>
      </div>
      <span className="col-start-2 row-start-1 mr-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white sm:order-last">
        <SearchIcon className="size-[18px]" />
      </span>
      <div className="col-span-2 flex min-w-0 flex-col gap-0.5 rounded-[18px] bg-warm-100 px-4 py-3 sm:flex-1 sm:py-3.5">
        <p className="type-small font-medium text-text-primary sm:type-body sm:font-medium">
          What&apos;s on your mind?
        </p>
        <p className="truncate type-small text-text-placeholder sm:type-body">
          I need help with <span className="font-medium text-text-primary">Anxiety</span>
        </p>
      </div>
    </div>
  );
}

/** Dashed sketch of a results list — the "this is where matches appear" filler. */
export function ResultsSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-1 flex-col gap-3 rounded-4xl border border-dashed border-warm-300 p-4 sm:p-6",
        className,
      )}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-dashed border-warm-300 p-3 sm:gap-4 sm:p-4"
        >
          <div className="size-10 shrink-0 rounded-full border border-dashed border-warm-300 sm:size-12" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-2.5 w-1/3 rounded-full border border-dashed border-warm-300" />
            <div className="h-2.5 w-2/3 rounded-full border border-dashed border-warm-300" />
          </div>
        </div>
      ))}
    </div>
  );
}
