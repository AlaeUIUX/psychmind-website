"use client";

import { cn } from "cn";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";
import { MapPinIcon, MonitorIcon } from "@/components/ui/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Facets } from "@/lib/search/engine";
import type { SearchFilters } from "@/lib/search/filters";
import { APPROACHES, GENDERS, LANGUAGES, SPECIALTIES } from "@/lib/taxonomy";

// The filters column (Figma S1 "Filters"), also used inside the phone
// drawer (S6). Headings and options are Figma copy; counts are how many
// providers each option gives with the other filters applied.
// TODO(client): new copy — "Show less", "No matches".

export type FilterProps = {
  filters: SearchFilters;
  update: (patch: Partial<SearchFilters>) => void;
  facets: Facets;
  price: { min: number; max: number };
};

/** Figma's patient filter shows these approaches first, in this order. */
const APPROACH_ORDER = ["cbt", "psychodynamic", "mindfulness", "dbt", "emdr", "humanistic"];
const FILTER_GENDERS = GENDERS.filter((g) => g.value !== "undisclosed");
/** The patient filter's age labels (Figma 6.1): "Adults", not the profile's "Adults 18+". */
const FILTER_AGES = [
  { value: "children", label: "Children" },
  { value: "teens", label: "Teens" },
  { value: "adults", label: "Adults" },
  { value: "seniors", label: "Seniors" },
];

function toggled(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn("flex flex-col gap-3 border-t border-warm-200 pt-5 first:border-t-0 first:pt-0", className)}>
      <h3 id={id} className="type-overline text-text-secondary">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function FormatToggle({ value, onChange, className }: { value: SearchFilters["format"]; onChange: (v: SearchFilters["format"]) => void; className?: string }) {
  return (
    <ToggleGroup
      type="single"
      value={value ?? ""}
      onValueChange={(v) => onChange((v || null) as SearchFilters["format"])}
      aria-label="Session format"
      className={cn("grid w-full grid-cols-2 gap-1 rounded-field bg-warm-100 p-1 ring-1 ring-warm-200 ring-inset", className)}
    >
      {[
        { v: "in_person", label: "In-person", Icon: MapPinIcon },
        { v: "online", label: "Online", Icon: MonitorIcon },
      ].map(({ v, label, Icon }) => (
        <ToggleGroupItem
          key={v}
          value={v}
          className="h-9 gap-1.5 rounded-[calc(var(--radius-field)-4px)] text-sm font-medium text-text-tertiary hover:bg-white/60 hover:text-text-primary data-[state=on]:bg-white data-[state=on]:text-text-primary data-[state=on]:shadow-control"
        >
          <Icon className="size-4" />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Checkbox list with counts, the first few shown and the rest behind "+N more". */
function Checklist({
  name,
  options,
  selected,
  counts,
  onToggle,
  shown = 4,
  search,
}: {
  name: string;
  options: { value: string; label: string }[];
  selected: string[];
  counts: Record<string, number>;
  onToggle: (value: string) => void;
  shown?: number;
  search?: { label: string; placeholder: string };
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const searchId = useId();

  // Chosen first, then the most providers, then the list's own order.
  const ordered = useMemo(
    () =>
      options
        .map((o, i) => ({ ...o, i, n: counts[o.value] ?? 0, on: selected.includes(o.value) }))
        .sort((a, b) => Number(b.on) - Number(a.on) || b.n - a.n || a.i - b.i),
    [options, counts, selected],
  );
  const matching = term.trim() ? ordered.filter((o) => o.label.toLowerCase().includes(term.trim().toLowerCase())) : ordered;
  const head = term.trim() ? matching : matching.slice(0, Math.max(shown, selected.length));
  const tail = term.trim() ? [] : matching.slice(head.length);

  // Unique per panel: the desktop column and the phone drawer can both be on the page.
  const prefix = useId();
  const row = (o: (typeof ordered)[number]) => {
    const id = `${prefix}${name}-${o.value}`.replace(/\W+/g, "-");
    const empty = !o.n && !o.on;
    return (
      <li key={o.value} className={cn("flex items-center gap-2.5", empty && "opacity-45")}>
        <Checkbox id={id} checked={o.on} onCheckedChange={() => onToggle(o.value)} disabled={empty} />
        <label htmlFor={id} className={cn("flex-1 cursor-pointer type-small text-text-secondary", empty && "cursor-default")}>
          {o.label}
        </label>
        <span className="type-small text-text-tertiary tabular-nums">{o.n}</span>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <Collapsible open={open} onOpenChange={setOpen}>
        <ul className="flex flex-col gap-2.5">{head.map(row)}</ul>
        {tail.length > 0 && (
          <>
            <CollapsibleContent>
              <ul className="mt-2.5 flex flex-col gap-2.5">{tail.map(row)}</ul>
            </CollapsibleContent>
            <CollapsibleTrigger className="mt-3 inline-flex items-center gap-1 rounded-tag type-small font-medium text-text-primary underline-offset-4 hover:underline focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none">
              {open ? "Show less" : `+${tail.length} more`}
              <ChevronDownIcon className={cn("size-4 transition-transform", open && "rotate-180")} />
            </CollapsibleTrigger>
          </>
        )}
        {term.trim() && !matching.length && <p className="type-small text-text-tertiary">No matches</p>}
      </Collapsible>
      {search && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={searchId} className="type-small font-medium text-text-primary">
            {search.label}
          </label>
          <div className="relative">
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-placeholder" />
            <Input
              id={searchId}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={search.placeholder}
              className="h-9 pl-9 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Chips({
  label,
  options,
  selected,
  counts,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  counts?: Record<string, number>;
  onToggle: (value: string) => void;
}) {
  return (
    <ToggleGroup
      type="multiple"
      variant="chip"
      size="chip"
      spacing={1.5}
      aria-label={label}
      value={selected}
      onValueChange={(next) => {
        const changed = next.find((v) => !selected.includes(v)) ?? selected.find((v) => !next.includes(v));
        if (changed) onToggle(changed);
      }}
      className="flex-wrap"
    >
      {options.map((o) => {
        const empty = counts ? !(counts[o.value] ?? 0) && !selected.includes(o.value) : false;
        return (
          <ToggleGroupItem key={o.value} value={o.value} disabled={empty} className="h-8 px-3 text-[13px] disabled:opacity-45">
            {o.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

/** Remounted (by key) whenever the applied range changes, e.g. Clear all. */
function PriceFilter({ initial, update, price }: { initial: [number, number] } & Pick<FilterProps, "update" | "price">) {
  const [range, setRange] = useState<[number, number]>(initial);

  const commit = ([from, to]: number[]) =>
    update({ min: from <= price.min ? null : from, max: to >= price.max ? null : to });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-9 items-center gap-1.5 rounded-field border border-warm-200 bg-white px-3 type-small shadow-control">
          <span className="text-text-tertiary">From</span>
          <span className="font-medium text-text-primary tabular-nums">{range[0]} USD</span>
        </span>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-field border border-warm-200 bg-white px-3 type-small shadow-control">
          <span className="text-text-tertiary">To</span>
          <span className="font-medium text-text-primary tabular-nums">
            {range[1]} USD{range[1] >= price.max ? "+" : ""}
          </span>
        </span>
      </div>
      <Slider
        min={price.min}
        max={price.max}
        step={10}
        minStepsBetweenThumbs={1}
        value={range}
        onValueChange={(v) => setRange([v[0], v[1]])}
        onValueCommit={commit}
        aria-label="Price per session"
        className="px-1 [&_[data-slot=slider-range]]:bg-warm-800 [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-warm-800 [&_[data-slot=slider-track]]:bg-warm-200"
      />
    </div>
  );
}

export function FiltersPanel({ filters, update, facets, price, showFormat = true }: FilterProps & { showFormat?: boolean }) {
  const specialties = SPECIALTIES.map((s) => ({ value: s.value, label: s.label }));
  const approaches = [...APPROACHES].sort((a, b) => {
    const ia = APPROACH_ORDER.indexOf(a.value);
    const ib = APPROACH_ORDER.indexOf(b.value);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const [moreApproaches, setMoreApproaches] = useState(false);
  const shownApproaches = moreApproaches
    ? approaches
    : approaches.filter((a, i) => i < APPROACH_ORDER.length || filters.approach.includes(a.value));
  const languages = LANGUAGES.filter((l) => facets.language[l.value] || filters.language.includes(l.value));
  const lo = Math.min(filters.min ?? price.min, price.max);
  const hi = Math.max(filters.max ?? price.max, lo);
  const slidingId = useId();

  return (
    <div className="flex flex-col gap-5">
      {showFormat && (
        <Section title="Session format">
          <FormatToggle value={filters.format} onChange={(format) => update({ format })} />
        </Section>
      )}

      <Section title="Specialties">
        <Checklist
          name="specialty"
          options={specialties}
          selected={filters.specialty}
          counts={facets.specialty}
          onToggle={(v) => update({ specialty: toggled(filters.specialty, v) })}
          search={{ label: "Search specialty", placeholder: "e.g: Grief & loss" }}
        />
      </Section>

      <Section title="Therapy approach">
        <Chips
          label="Therapy approach"
          options={shownApproaches}
          selected={filters.approach}
          counts={facets.approach}
          onToggle={(v) => update({ approach: toggled(filters.approach, v) })}
        />
        {approaches.length > shownApproaches.length || moreApproaches ? (
          <button
            type="button"
            onClick={() => setMoreApproaches((v) => !v)}
            className="inline-flex w-fit items-center gap-1 type-small font-medium text-text-primary underline-offset-4 hover:underline"
          >
            {moreApproaches ? "Show less" : `+${approaches.length - shownApproaches.length} more`}
            <ChevronDownIcon className={cn("size-4 transition-transform", moreApproaches && "rotate-180")} />
          </button>
        ) : null}
      </Section>

      <Section title="Provider gender">
        <Chips
          label="Provider gender"
          options={FILTER_GENDERS.map((g) => ({ value: g.value, label: g.label }))}
          selected={filters.gender}
          counts={facets.gender}
          onToggle={(v) => update({ gender: toggled(filters.gender, v) })}
        />
      </Section>

      <Section title="Language">
        <Checklist
          name="language"
          options={languages}
          selected={filters.language}
          counts={facets.language}
          onToggle={(v) => update({ language: toggled(filters.language, v) })}
        />
      </Section>

      <Section title="AGE Groups">
        <Chips
          label="Age groups"
          options={FILTER_AGES}
          selected={filters.age}
          counts={facets.age}
          onToggle={(v) => update({ age: toggled(filters.age, v) })}
        />
      </Section>

      <Section title="Financial filters">
        <PriceFilter key={`${lo}-${hi}`} initial={[lo, hi]} update={update} price={price} />
        <div className="flex items-center gap-2.5">
          <Checkbox id={slidingId} checked={filters.sliding} onCheckedChange={(v) => update({ sliding: v === true })} />
          <label htmlFor={slidingId} className="cursor-pointer type-small text-text-secondary">
            Sliding scale available
          </label>
        </div>
      </Section>
    </div>
  );
}
