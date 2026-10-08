"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useMemo, useRef } from "react";
import { SavedProvidersProvider, type Viewer } from "@/components/directory/save-button";
import type { Ranked, SearchResult } from "@/lib/search/engine";
import type { DirectoryProvider } from "@/server/directory/data";
import { FiltersPanel } from "./filters-panel";
import { MobileSearch } from "./mobile-search";
import { ProviderOverlay } from "./provider-overlay";
import { ActiveFilters, NeedsLocation, ResultsBody, ResultsCount, SortMenu } from "./results";
import { SearchBar } from "./search-bar";
import { SearchProvider, useSearchControls } from "./use-search";

// Search results (Figma S1/S5): the search bar on top, filters on the left,
// results on the right. A result opens in a quick look over the page (?p=);
// on phones Back closes it.

export function SearchApp({
  result,
  viewer,
  savedIds,
  cities,
  selected,
}: {
  result: SearchResult;
  viewer: Viewer;
  savedIds: string[];
  /** "City, ST" of every in-person practice, most providers first. */
  cities: string[];
  /** The provider in ?p= when they're not among these results (a shared link). */
  selected?: DirectoryProvider | null;
}) {
  const controls = useSearchControls();
  const { filters, set, clear } = controls;
  const [openId, setOpenId] = useQueryState("p", parseAsString.withOptions({ shallow: true, scroll: false }));
  const pushed = useRef(false);

  const items = useMemo<Ranked[]>(
    () => [...result.results, ...result.close, ...(result.results.length || result.close.length ? [] : result.recommended)],
    [result],
  );
  let overlayItems = items;
  let index = openId ? items.findIndex((r) => r.provider.publicId === openId) : -1;
  if (openId && index < 0 && selected?.publicId === openId) {
    overlayItems = [{ provider: selected, matched: [] }];
    index = 0;
  }

  const open = useCallback(
    (r: Ranked) => {
      pushed.current = true;
      void setOpenId(r.provider.publicId, { history: "push" });
    },
    [setOpenId],
  );
  const close = useCallback(() => {
    const last = openId;
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      void setOpenId(null, { history: "replace" });
    }
    // Back where they were in the list.
    if (last) requestAnimationFrame(() => document.getElementById(`provider-${last}`)?.scrollIntoView({ block: "nearest" }));
  }, [openId, setOpenId]);
  const step = useCallback((i: number) => void setOpenId(overlayItems[i].provider.publicId, { history: "replace" }), [overlayItems, setOpenId]);

  return (
    <SearchProvider value={controls}>
      <SavedProvidersProvider initial={savedIds}>
        <div className="flex flex-col gap-5">
          <div className="hidden lg:block">
            <SearchBar cities={cities} facets={result.facets} />
          </div>
          <div className="lg:hidden">
            <MobileSearch count={result.results.length} facets={result.facets} price={result.price} cities={cities} />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            <aside aria-label="Filters" className="sticky top-24 hidden lg:block">
              <div
                data-lenis-prevent
                className="max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain rounded-card border border-warm-200 bg-white p-5 [scrollbar-width:thin]"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="type-title text-text-primary">Filters</h2>
                  <button type="button" onClick={clear} className="type-small font-medium text-text-primary underline underline-offset-4 hover:text-text-secondary">
                    Clear all
                  </button>
                </div>
                <FiltersPanel filters={filters} update={set} facets={result.facets} price={result.price} />
              </div>
            </aside>

            <section aria-label="Results" className="flex min-w-0 flex-col gap-4">
              <ActiveFilters />
              <div className="hidden items-center justify-between gap-3 lg:flex">
                <ResultsCount count={result.results.length} />
                <SortMenu />
              </div>
              <NeedsLocation needs={result.needs} cities={cities} />
              <ResultsBody result={result} viewer={viewer} onOpen={open} />
            </section>
          </div>
        </div>

        <ProviderOverlay items={overlayItems} index={index} onIndex={step} onClose={close} viewer={viewer} />
      </SavedProvidersProvider>
    </SearchProvider>
  );
}
