"use client";

import { useQueryStates } from "nuqs";
import { createContext, useCallback, useContext, useMemo, useTransition } from "react";
import { EMPTY_FILTERS, searchParsers, type SearchFilters } from "@/lib/search/filters";

// Search state is the URL. Changing a filter rewrites the query string and
// the server sends back new results; `pending` is true until they arrive.

type ListKey = "specialty" | "approach" | "gender" | "language" | "age";

export type SearchControls = {
  filters: SearchFilters;
  pending: boolean;
  set: (patch: Partial<SearchFilters>) => void;
  toggle: (key: ListKey, value: string) => void;
  clear: () => void;
};

export function useSearchControls(): SearchControls {
  const [pending, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(searchParsers, {
    shallow: false,
    history: "replace",
    scroll: false,
    startTransition,
  });

  const set = useCallback((patch: Partial<SearchFilters>) => void setFilters(patch), [setFilters]);
  const toggle = useCallback(
    (key: ListKey, value: string) =>
      void setFilters((prev) => {
        const list = prev[key];
        return { [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
      }),
    [setFilters],
  );
  // Clearing keeps the sort order.
  const clear = useCallback(() => void setFilters((prev) => ({ ...EMPTY_FILTERS, sort: prev.sort })), [setFilters]);

  return useMemo(() => ({ filters, pending, set, toggle, clear }), [filters, pending, set, toggle, clear]);
}

const SearchContext = createContext<SearchControls | null>(null);
export const SearchProvider = SearchContext.Provider;

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchProvider>");
  return ctx;
}
