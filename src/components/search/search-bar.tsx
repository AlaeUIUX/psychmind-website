"use client";

import { cn } from "cn";
import { useState, type ReactNode } from "react";
import { SessionModeSwitch } from "@/components/shared/session-mode-switch";
import { SearchIcon } from "@/components/ui/icons";
import type { Facets } from "@/lib/search/engine";
import type { SearchFilters } from "@/lib/search/filters";
import { MindInput, StateSelect, WhereInput, WhoFeelsRight } from "./search-fields";
import { useSearch } from "./use-search";

// The search bar over the results (Figma S1): session format, Where?, What's
// on your mind?, Who feels right, and the search button. It shares the home
// page search tool's look. Choosing Online turns "Where?" into a state
// picker, since providers can only see clients in states where they're
// licensed.

export const searchSurface =
  "bg-white ring-1 ring-warm-200 shadow-[0_1px_2px_rgb(28_25_23/0.04),0_24px_56px_-28px_rgb(28_25_23/0.22)]";

/** A labelled field. Search boxes name themselves (cmdk), so only selects need `htmlFor`. */
function Field({ label, htmlFor, children, className }: { label: string; htmlFor?: string; children: ReactNode; className?: string }) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className={cn("flex min-w-0 flex-col justify-center gap-2 rounded-[24px] px-4 py-3", className)}>
      <Label htmlFor={htmlFor} aria-hidden={htmlFor ? undefined : true} className="type-small font-medium text-text-primary">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Divider() {
  return <div aria-hidden className="my-4 w-px self-stretch bg-warm-200" />;
}

export const toMode = (f: SearchFilters["format"]) => (f === "in_person" ? "in-person" : f === "online" ? "online" : null);
export const fromMode = (m: "in-person" | "online"): SearchFilters["format"] => (m === "in-person" ? "in_person" : "online");

export function SearchBar({ cities, facets }: { cities: string[]; facets: Facets }) {
  const { filters, set } = useSearch();
  // Typed text waits for Enter or the search button; everything else applies at once.
  const [where, setWhere] = useState(filters.where);
  const [mind, setMind] = useState(filters.q);
  const [seen, setSeen] = useState({ where: filters.where, q: filters.q });
  if (seen.where !== filters.where || seen.q !== filters.q) {
    // The URL changed underneath (Clear all, a removed chip, Back).
    setSeen({ where: filters.where, q: filters.q });
    setWhere(filters.where);
    setMind(filters.q);
  }

  return (
    <form
      role="search"
      aria-label="Search providers"
      onSubmit={(e) => {
        e.preventDefault();
        set({ where: where.trim(), q: mind.trim() });
      }}
      className={cn("flex items-stretch gap-1 rounded-[32px] p-2", searchSurface)}
    >
      <div className="flex shrink-0 flex-col justify-center gap-2 px-4 py-3">
        <span className="type-small font-medium text-text-primary">Session format</span>
        <SessionModeSwitch size="sm" value={toMode(filters.format)} onChange={(m) => set({ format: fromMode(m) })} />
      </div>
      <Divider />
      <Field label="Where?" htmlFor={filters.format === "online" ? "search-state" : undefined} className="w-[clamp(200px,22%,280px)]">
        {filters.format === "online" ? (
          <StateSelect id="search-state" value={filters.where} onChange={(code) => set({ where: code })} />
        ) : (
          <WhereInput format={filters.format} text={where} onText={setWhere} onApply={(w) => set({ where: w })} cities={cities} />
        )}
      </Field>
      <Divider />
      <Field label="What's on your mind?" className="flex-1">
        <MindInput
          text={mind}
          onText={setMind}
          onSearch={(q) => set({ q })}
          onSpecialty={(v) => set({ specialty: filters.specialty.includes(v) ? filters.specialty : [...filters.specialty, v] })}
        />
      </Field>
      <Divider />
      <div className="hidden min-w-0 flex-col justify-center gap-2 px-4 py-3 xl:flex">
        <span className="type-small font-medium text-text-primary">Who feels right</span>
        <WhoFeelsRight filters={filters} update={set} facets={facets} />
      </div>
      <button
        type="submit"
        aria-label="Search"
        className="my-auto mr-1 ml-1 flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-[0_10px_24px_-10px_rgb(192_16_72/0.6)] transition-[scale,background-color] duration-300 ease-out-soft hover:scale-[1.04] hover:bg-brand-primary-hover active:scale-[0.97]"
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
}
