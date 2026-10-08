"use client";

import { ArrowUpRightIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { displayName } from "@/lib/provider/display";
import type { DirectoryProvider } from "@/server/directory/data";
import { ProviderCard } from "./provider-card";
import { QuickView } from "./quick-view";
import { SavedProvidersProvider, useSavedIds, type Viewer } from "./save-button";

// Results with a quick view: on desktop the selected provider shows beside
// the list; on phones it opens in a sheet. "See full profile" opens the
// public profile in a new tab. The selection lives in the URL (?p=) so a
// shared link opens on the same provider.

const PAGE = 20;
const DESKTOP = "(min-width: 1024px)";

function Browser({ providers, viewer, initialId }: { providers: DirectoryProvider[]; viewer: Viewer; initialId?: string }) {
  const startIndex = Math.max(0, providers.findIndex((p) => p.publicId === initialId));
  const [selectedId, setSelectedId] = useState(providers[startIndex]?.publicId);
  const [visible, setVisible] = useState(Math.max(PAGE, Math.ceil((startIndex + 1) / PAGE) * PAGE));
  const [sheetOpen, setSheetOpen] = useState(false);
  const isSaved = useSavedIds();

  // Arriving with ?p= (e.g. "Go back to results"): bring that card into view.
  useEffect(() => {
    if (initialId) document.getElementById(`provider-${initialId}`)?.scrollIntoView({ block: "center" });
  }, [initialId]);

  const index = providers.findIndex((p) => p.publicId === selectedId);
  const selected = providers[index];

  const select = useCallback((publicId: string, { openSheet = true } = {}) => {
    setSelectedId(publicId);
    const url = new URL(window.location.href);
    url.searchParams.set("p", publicId);
    window.history.replaceState(null, "", url);
    if (openSheet && !window.matchMedia(DESKTOP).matches) setSheetOpen(true);
  }, []);

  const step = (delta: number) => {
    const next = providers[index + delta];
    if (!next) return;
    if (index + delta >= visible) setVisible((v) => v + PAGE);
    select(next.publicId, { openSheet: false });
    document.getElementById(`provider-${next.publicId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,480px)]">
      <div className="flex flex-col gap-3">
        <ol className="flex flex-col gap-3" aria-label="Providers">
          {providers.slice(0, visible).map((p) => (
            <li key={p.id} id={`provider-${p.publicId}`} className="scroll-mt-28">
              <ProviderCard p={p} selected={p.publicId === selectedId} onSelect={() => select(p.publicId)} viewer={viewer} />
            </li>
          ))}
        </ol>
        {visible < providers.length && (
          <Button type="button" variant="secondary" className="mx-auto mt-3" onClick={() => setVisible((v) => v + PAGE)}>
            {/* TODO(client): copy */}
            Show more providers
          </Button>
        )}
      </div>

      {/* Desktop quick view: sticky beside the list, scrolls on its own. */}
      {selected && (
        <aside aria-label={`Quick view: ${displayName(selected)}`} className="sticky top-24 hidden lg:block">
          <div data-lenis-prevent className="max-h-[calc(100svh-7.5rem)] overflow-y-auto overscroll-contain rounded-card border border-warm-200 bg-white shadow-card [scrollbar-width:thin]">
            <QuickView
              p={selected}
              viewer={viewer}
              saved={isSaved(selected.id)}
              onPrev={index > 0 ? () => step(-1) : undefined}
              onNext={index < providers.length - 1 ? () => step(1) : undefined}
            />
          </div>
        </aside>
      )}

      {/* Phones: the same quick view in a bottom sheet. */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[90svh] gap-0 rounded-t-2xl p-0 lg:hidden">
          {selected && (
            <>
              <SheetTitle className="sr-only">Quick view: {displayName(selected)}</SheetTitle>
              <SheetDescription className="sr-only">A quick look at this provider</SheetDescription>
              <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <QuickView p={selected} viewer={viewer} saved={isSaved(selected.id)} />
              </div>
              <SheetFooter className="border-t border-warm-100 p-3">
                <Button asChild fullWidth className="h-11 text-[15px]">
                  <a href={selected.href} target="_blank" rel="noopener">
                    See full profile
                    <ArrowUpRightIcon />
                  </a>
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function DirectoryBrowser({
  providers,
  savedIds,
  viewer,
  initialId,
}: {
  providers: DirectoryProvider[];
  savedIds: string[];
  viewer: Viewer;
  initialId?: string;
}) {
  return (
    <SavedProvidersProvider initial={savedIds}>
      <Browser providers={providers} viewer={viewer} initialId={initialId} />
    </SavedProvidersProvider>
  );
}
