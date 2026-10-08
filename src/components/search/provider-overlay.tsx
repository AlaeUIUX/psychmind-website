"use client";

import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { useEffect } from "react";
import { QuickView } from "@/components/directory/quick-view";
import { useSavedIds, type Viewer } from "@/components/directory/save-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { displayName } from "@/lib/provider/display";
import type { Ranked } from "@/lib/search/engine";

// The quick look: a layer over the results with the background blurred.
// Click outside (or Esc, or Back on a phone) to return to the results;
// "See full profile" opens the provider's page in a new tab. The arrows (and
// ← →) step through the results without closing.

export function ProviderOverlay({
  items,
  index,
  onIndex,
  onClose,
  viewer,
}: {
  items: Ranked[];
  /** Which item is open; -1 when closed. */
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  viewer: Viewer;
}) {
  const isSaved = useSavedIds();
  const item = items[index];
  const p = item?.provider;
  const prev = index > 0 ? index - 1 : null;
  const next = index >= 0 && index < items.length - 1 ? index + 1 : null;

  useEffect(() => {
    if (!p) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [role=dialog] [role=dialog]")) return;
      if (e.key === "ArrowLeft" && prev != null) onIndex(prev);
      if (e.key === "ArrowRight" && next != null) onIndex(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p, prev, next, onIndex]);

  return (
    <Dialog open={!!p} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-warm-950/35 backdrop-blur-md"
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[min(860px,calc(100dvh-3rem))] sm:max-w-[600px] sm:rounded-card sm:border sm:p-0"
      >
        {p && (
          <>
            <DialogTitle className="sr-only">Quick look: {displayName(p)}</DialogTitle>
            <DialogDescription className="sr-only">A quick look at this provider. Open the full profile to see everything.</DialogDescription>

            <div className="flex items-center justify-between gap-2 border-b border-warm-100 px-3 py-2.5 sm:px-4">
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => prev != null && onIndex(prev)} disabled={prev == null} aria-label="Previous provider">
                  <ChevronLeftIcon />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => next != null && onIndex(next)} disabled={next == null} aria-label="Next provider">
                  <ChevronRightIcon />
                </Button>
                {items.length > 1 && (
                  <span className="ml-1 type-caption text-text-tertiary tabular-nums">
                    {index + 1} of {items.length}
                  </span>
                )}
                <span aria-hidden className="ml-2 hidden items-center gap-1 type-caption text-text-placeholder sm:inline-flex">
                  <Kbd small>←</Kbd>
                  <Kbd small>→</Kbd>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-[13px]">
                  <a href={p.href} target="_blank" rel="noopener">
                    Full profile
                    <ArrowUpRightIcon />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Close and go back to results">
                    <XIcon />
                  </Button>
                </DialogClose>
              </div>
            </div>

            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <QuickView p={p} viewer={viewer} saved={isSaved(p.id)} matched={item.matched} />
            </div>

            <div className="border-t border-warm-100 bg-white p-3 sm:px-5">
              <Button asChild fullWidth className="h-11 text-[15px]">
                <a href={p.href} target="_blank" rel="noopener">
                  See full profile
                  <ArrowUpRightIcon />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
