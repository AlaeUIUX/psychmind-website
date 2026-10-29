"use client";

import { cn } from "cn";
import { ArrowDownUpIcon, GlobeIcon, InfoIcon, ListFilterIcon, SearchIcon, SparklesIcon, UserRoundIcon, XIcon } from "@/components/ui/hugeicons";
import { useState, type ReactNode } from "react";
import { EmptyState } from "@/components/app/empty-state";
import { pill, topicChipOn } from "@/components/home/search-styles";
import { ProviderCard } from "@/components/directory/provider-card";
import type { Viewer } from "@/components/directory/save-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPinIcon, VerifiedSealIcon } from "@/components/ui/icons";
import type { TermParts } from "@/lib/analytics/events";
import type { Ranked, SearchResult } from "@/lib/search/engine";
import { SORTS, type SearchFilters, type Sort } from "@/lib/search/filters";
import { parsePlace } from "@/lib/search/location";
import { labelOf } from "@/lib/taxonomy";
import { StateSelect, WhereInput } from "./search-fields";
import { useSearch } from "./use-search";

// The results column: chosen filters as removable chips, the count and sort,
// then the cards. Fewer than 10 matches adds "Close matches"; none at all
// shows Figma's empty state (S2) with recommended providers.
// TODO(client): sort labels, "Close matches" copy, location prompts.

const PAGE = 20;

export const SORT_LABELS: Record<Sort, string> = {
  best: "Best match",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  experience: "Most experience",
};

type Chip = { key: string; label: string; icon?: ReactNode; remove: Partial<SearchFilters> };

function chipsFor(f: SearchFilters): Chip[] {
  const without = (list: string[], v: string) => list.filter((x) => x !== v);
  const place = parsePlace(f.where);
  return [
    place && { key: "where", label: place.label, icon: <MapPinIcon className="size-3.5" />, remove: { where: "" } },
    f.q && { key: "q", label: `“${f.q}”`, remove: { q: "" } },
    ...f.specialty.map((v) => ({ key: `s-${v}`, label: labelOf("specialties", v), icon: <ListFilterIcon className="size-3.5" />, remove: { specialty: without(f.specialty, v) } })),
    ...f.approach.map((v) => ({ key: `a-${v}`, label: labelOf("approaches", v), remove: { approach: without(f.approach, v) } })),
    ...f.gender.map((v) => ({ key: `g-${v}`, label: labelOf("genders", v), icon: <UserRoundIcon className="size-3.5" />, remove: { gender: without(f.gender, v) } })),
    ...f.language.map((v) => ({ key: `l-${v}`, label: v, icon: <GlobeIcon className="size-3.5" />, remove: { language: without(f.language, v) } })),
    ...f.age.map((v) => ({ key: `y-${v}`, label: labelOf("ages", v).replace(" +18", ""), remove: { age: without(f.age, v) } })),
    (f.min != null || f.max != null) && {
      key: "price",
      label: f.min != null && f.max != null ? `${f.min}–${f.max} USD` : f.min != null ? `From ${f.min} USD` : `Up to ${f.max} USD`,
      remove: { min: null, max: null },
    },
    f.sliding && { key: "sliding", label: "Sliding scale", remove: { sliding: false } },
  ].filter(Boolean) as Chip[];
}

export function ActiveFilters() {
  const { filters, set, clear } = useSearch();
  const chips = chipsFor(filters);
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Chosen filters">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => set(c.remove)}
          aria-label={`Remove ${c.label}`}
          // the bar's chosen chip: an ink pill
          className={cn(pill, topicChipOn, "gap-1.5 hover:bg-warm-700")}
        >
          {c.icon}
          <span className="max-w-[220px] truncate">{c.label}</span>
          <XIcon className="text-white/70" />
        </button>
      ))}
      <button type="button" onClick={clear} className="ml-1 text-[13px] text-warm-900/60 underline underline-offset-4 transition-colors hover:text-warm-900">
        Clear all
      </button>
    </div>
  );
}

export function SortMenu() {
  const { filters, set } = useSearch();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Sort: ${SORT_LABELS[filters.sort]}`} className="h-9 gap-1.5 px-2.5 text-[13px] text-text-secondary">
          <ArrowDownUpIcon />
          <span className="hidden sm:inline">Sort: {SORT_LABELS[filters.sort]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={filters.sort} onValueChange={(v) => set({ sort: v as Sort })}>
          {SORTS.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              {SORT_LABELS[s]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The count line (Figma "132 providers found"), or S4's "Searching our database..." while results load. */
export function ResultsCount({ count }: { count: number }) {
  const { pending } = useSearch();
  return pending ? (
    <p role="status" className="flex items-center gap-2 type-small text-text-secondary">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home/logo.svg" alt="" className="size-4 animate-spin motion-reduce:animate-none" />
      Searching our database...
    </p>
  ) : (
    <p role="status" className="type-small text-text-secondary">
      <span className="font-medium text-text-primary">{count}</span>
      {count === 1 ? " provider found" : " providers found"}
    </p>
  );
}

/** Online needs a state, in-person a place, before those filters can apply. */
export function NeedsLocation({ needs, cities }: { needs: SearchResult["needs"]; cities: string[] }) {
  const { filters, set } = useSearch();
  const [text, setText] = useState("");
  if (!needs) return null;
  return (
    <div className="flex flex-col gap-3 rounded-field border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2.5 type-small text-sky-900">
        <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-sky-700" />
        {needs === "state"
          ? "Providers can only see clients in states where they're licensed. Add your state to see who can work with you online."
          : "Add your city or ZIP code to see providers near you."}
      </p>
      <div className="w-full shrink-0 sm:w-56">
        {needs === "state" ? (
          <StateSelect value={filters.where} onChange={(code) => set({ where: code })} className="bg-white" />
        ) : (
          <WhereInput format="in_person" text={text} onText={setText} onApply={(w) => set({ where: w })} cities={cities} />
        )}
      </div>
    </div>
  );
}

/** What an impression is reported against: the search, as known values. */
export type Impression = { term: TermParts; key: string };

function CardList({ items, viewer, onOpen, impression }: { items: Ranked[]; viewer: Viewer; onOpen: (r: Ranked) => void; impression?: Impression }) {
  const [visible, setVisible] = useState(PAGE);
  return (
    <>
      <ol className="flex flex-col gap-3" aria-label="Providers">
        {items.slice(0, visible).map((r) => (
          <li key={r.provider.id} id={`provider-${r.provider.publicId}`} className="scroll-mt-28">
            <ProviderCard ranked={r} viewer={viewer} onOpen={() => onOpen(r)} impression={impression} />
          </li>
        ))}
      </ol>
      {visible < items.length && (
        <Button type="button" variant="secondary" className="mx-auto mt-2" onClick={() => setVisible((v) => v + PAGE)}>
          Show more providers
        </Button>
      )}
    </>
  );
}

export function ResultsBody({
  result,
  viewer,
  onOpen,
  impression,
}: {
  result: SearchResult;
  viewer: Viewer;
  onOpen: (r: Ranked) => void;
  impression?: Impression;
}) {
  const { pending, clear } = useSearch();
  return (
    <div className={cn("flex flex-col gap-3 transition-opacity duration-200", pending && "pointer-events-none opacity-60")} aria-busy={pending}>
      {result.results.length ? (
        // Re-keyed per search so "Show more" starts over.
        <CardList key={result.results.map((r) => r.provider.id).join()} items={result.results} viewer={viewer} onOpen={onOpen} impression={impression} />
      ) : (
        <EmptyState
          art={<SearchIcon />}
          title="We couldn’t find providers within the chosen filters"
          action={
            <Button type="button" variant="secondary" onClick={clear}>
              Clear filters
            </Button>
          }
        >
          Try tweaking filters to get more results
        </EmptyState>
      )}

      {result.close.length > 0 && (
        <section aria-labelledby="close-title" className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="close-title" className="flex items-center gap-2 text-[15px] leading-5 font-medium tracking-[-0.01em] text-warm-900">
              <SparklesIcon className="size-4 text-amber-600" />
              Close matches
            </h2>
            <p className="text-[13px] leading-[18px] text-warm-900/60">These providers match everything you chose except one thing.</p>
          </div>
          <CardList items={result.close} viewer={viewer} onOpen={onOpen} impression={impression} />
        </section>
      )}

      {!result.results.length && !result.close.length && result.recommended.length > 0 && (
        <section aria-labelledby="recommended-title" className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            {/* section titles in the privacy promise's 15px medium, as the empty state's */}
            <h2 id="recommended-title" className="text-[15px] leading-5 font-medium tracking-[-0.01em] text-warm-900">
              Recommended providers
            </h2>
            <p className="hidden items-center gap-1.5 text-[13px] leading-[18px] text-warm-900/60 sm:flex">
              <VerifiedSealIcon className="size-3.5 text-blue-600" />
              Verified by PsychMind
            </p>
          </div>
          {/* Seen in search, but not for this search: no search term. */}
          <CardList items={result.recommended} viewer={viewer} onOpen={onOpen} impression={impression && { term: undefined, key: impression.key }} />
        </section>
      )}
    </div>
  );
}
