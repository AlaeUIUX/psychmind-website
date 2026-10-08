"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icons";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Facets } from "@/lib/search/engine";
import { activeFilterCount, EMPTY_FILTERS, type SearchFilters } from "@/lib/search/filters";
import { parsePlace } from "@/lib/search/location";
import { labelOf } from "@/lib/taxonomy";
import { FiltersPanel, FormatToggle } from "./filters-panel";
import { ResultsCount, SortMenu } from "./results";
import { searchSurface } from "./search-bar";
import { MindInput, StateSelect, WhereInput } from "./search-fields";
import { useSearch } from "./use-search";

// Phones and tablets (Figma S5/S6): a collapsed search card and a Filters
// button, both opening the "Search filters" drawer. Changes in the drawer
// apply on Save (Figma's label), so the results don't jump while choosing.

function summary(f: SearchFilters) {
  const parts = [
    f.format === "online" ? "Online" : f.format === "in_person" ? "In-person" : null,
    parsePlace(f.where)?.label,
    f.q ? `“${f.q}”` : null,
    ...f.specialty.map((s) => labelOf("specialties", s)),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function FiltersDrawer({
  open,
  onOpenChange,
  facets,
  price,
  cities,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facets: Facets;
  price: { min: number; max: number };
  cities: string[];
}) {
  const { filters, set } = useSearch();
  const [draft, setDraft] = useState(filters);
  const [where, setWhere] = useState(filters.where);
  const [mind, setMind] = useState(filters.q);
  const update = (patch: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...patch }));

  // Each time it opens, start from what's applied.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(filters);
      setWhere(filters.where);
      setMind(filters.q);
    }
  }

  const save = () => {
    set({ ...draft, where: draft.format === "online" ? draft.where : where.trim(), q: mind.trim() });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-white p-0 sm:max-w-[400px]">
        <SheetHeader className="border-b border-warm-100 px-5 pt-5 pb-4">
          <SheetTitle className="type-title text-text-primary">Search filters</SheetTitle>
          <SheetDescription className="type-small text-text-tertiary">Filter your search results to fit your needs</SheetDescription>
        </SheetHeader>

        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <div className="mb-6 flex flex-col gap-4 rounded-card bg-warm-50 p-4 ring-1 ring-warm-200 ring-inset">
            <div className="flex flex-col gap-2">
              <span className="type-small font-medium text-text-primary">Session format</span>
              <FormatToggle value={draft.format} onChange={(format) => update({ format })} className="bg-white" />
            </div>
            <div className="flex flex-col gap-2">
              {draft.format === "online" ? (
                <label htmlFor="drawer-state" className="type-small font-medium text-text-primary">
                  Where?
                </label>
              ) : (
                <span aria-hidden className="type-small font-medium text-text-primary">
                  Where?
                </span>
              )}
              {draft.format === "online" ? (
                <StateSelect id="drawer-state" value={draft.where} onChange={(code) => update({ where: code })} className="bg-white" />
              ) : (
                <WhereInput format={draft.format} text={where} onText={setWhere} onApply={(w) => setWhere(w)} cities={cities} />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span aria-hidden className="type-small font-medium text-text-primary">
                What&apos;s on your mind?
              </span>
              <MindInput
                text={mind}
                onText={setMind}
                onSearch={setMind}
                onSpecialty={(v) => update({ specialty: draft.specialty.includes(v) ? draft.specialty : [...draft.specialty, v] })}
              />
            </div>
          </div>
          <FiltersPanel filters={draft} update={update} facets={facets} price={price} showFormat={false} />
        </div>

        <SheetFooter className="grid grid-cols-[auto_1fr_1fr] gap-2 border-t border-warm-100 bg-white p-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDraft({ ...EMPTY_FILTERS, sort: draft.sort });
              setWhere("");
              setMind("");
            }}
          >
            Clear all
          </Button>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="brand" onClick={save}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function MobileSearch({ count, facets, price, cities }: { count: number; facets: Facets; price: { min: number; max: number }; cities: string[] }) {
  const { filters } = useSearch();
  const [open, setOpen] = useState(false);
  const active = activeFilterCount(filters);
  const current = summary(filters);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group flex w-full items-center justify-between gap-3 rounded-[28px] p-2 text-left ${searchSurface}`}
      >
        <span className="flex min-w-0 flex-col gap-0.5 px-3">
          <span className="flex items-center gap-2 type-body font-medium text-text-primary">
            <SearchIcon className="size-4 shrink-0 text-text-secondary" />
            {current ? "Your search" : "Start search"}
          </span>
          <span className="truncate type-small text-text-placeholder">{current ?? "Press to get started"}</span>
        </span>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-control transition-[scale,background-color] duration-300 ease-out-soft group-hover:scale-105 group-hover:bg-brand-primary-hover">
          <SearchIcon className="size-[18px]" />
        </span>
      </button>

      <div className="flex items-center justify-between gap-2">
        <ResultsCount count={count} />
        <div className="flex items-center gap-1">
          <SortMenu />
          <Button type="button" variant="secondary" size="sm" className="h-9 gap-1.5 px-3 text-[13px]" onClick={() => setOpen(true)}>
            <SlidersHorizontalIcon />
            Filters
            {active > 0 && (
              <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-warm-800 text-[11px] font-semibold text-white">{active}</span>
            )}
          </Button>
        </div>
      </div>

      <FiltersDrawer open={open} onOpenChange={setOpen} facets={facets} price={price} cities={cities} />
    </div>
  );
}
