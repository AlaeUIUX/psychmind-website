"use client";

import { cn } from "cn";
import { GlobeIcon, HashIcon, SearchIcon, UserRoundIcon } from "lucide-react";
import { useMemo } from "react";
import { MapPinIcon, PlusIcon } from "@/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Facets } from "@/lib/search/engine";
import type { SearchFilters } from "@/lib/search/filters";
import { parsePlace } from "@/lib/search/location";
import { suggestSpecialties } from "@/lib/search/text";
import { GENDERS, labelOf, US_STATES } from "@/lib/taxonomy";
import { ComboField, type Suggestion } from "./combo-field";

// The search inputs, shared by the desktop search bar and the phone drawer.
// Field labels are Figma copy; placeholders and suggestion headings are new.
// TODO(client): placeholders, "Popular searches", "Your state".

/** Figma's "What's on your mind?" suggestions (Assets, 343:22152). */
const POPULAR = ["Anxiety", "Trauma", "PTSD", "Depression", "Family issues", "Cultural changes"];

export function wherePlaceholder(format: SearchFilters["format"]) {
  return format === "in_person" ? "City or ZIP code" : "City, ZIP or state";
}

export function WhereInput({
  format,
  text,
  onText,
  onApply,
  cities,
}: {
  format: SearchFilters["format"];
  text: string;
  onText: (text: string) => void;
  /** Choose a place now (a suggestion, or Enter). */
  onApply: (where: string) => void;
  /** "City, ST" for every practice in the directory. */
  cities: string[];
}) {
  const suggestions = useMemo<Suggestion[]>(() => {
    const t = text.trim().toLowerCase();
    const pin = <MapPinIcon className="size-4 text-text-tertiary" />;
    if (!t) return cities.slice(0, 6).map((c) => ({ value: c, label: c, icon: pin }));
    const zip = t.match(/^\d{5}$/)?.[0];
    const fromZip = zip ? [{ value: zip, label: parsePlace(zip)?.label ?? zip, icon: <HashIcon className="size-4 text-text-tertiary" /> }] : [];
    const cityHits = cities.filter((c) => c.toLowerCase().includes(t)).slice(0, 6);
    const stateHits = format === "in_person" ? [] : US_STATES.filter((s) => s.label.toLowerCase().startsWith(t)).slice(0, 3);
    return [
      ...fromZip,
      ...cityHits.map((c) => ({ value: c, label: c, icon: pin })),
      ...stateHits.map((s) => ({ value: s.label, label: s.label, hint: "State", icon: pin })),
    ];
  }, [text, cities, format]);

  return (
    <ComboField
      label="Where?"
      value={text}
      onValueChange={onText}
      onSubmit={() => onApply(text.trim())}
      onPick={(s) => {
        onText(s.value);
        onApply(s.value);
      }}
      suggestions={suggestions}
      heading={text.trim() ? undefined : "Places with providers"}
      placeholder={wherePlaceholder(format)}
      icon={<MapPinIcon className="size-4 shrink-0 text-text-secondary" />}
      onClear={() => {
        onText("");
        onApply("");
      }}
    />
  );
}

/** Online sessions only need the patient's state: providers must be licensed there. */
export function StateSelect({
  value,
  onChange,
  className,
  id,
}: {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  id?: string;
}) {
  const code = parsePlace(value)?.state ?? "";
  return (
    <Select value={code} onValueChange={onChange}>
      <SelectTrigger id={id} size="sm" aria-label="Your state" className={cn("h-10 w-full bg-warm-50 text-sm font-medium", className)}>
        <span className="flex min-w-0 items-center gap-2">
          <MapPinIcon className="size-4 shrink-0 text-text-secondary" />
          <SelectValue placeholder="Your state" />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        {US_STATES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MindInput({
  text,
  onText,
  onSearch,
  onSpecialty,
}: {
  text: string;
  onText: (text: string) => void;
  /** Search for these words (Enter, a popular search, or clearing). */
  onSearch: (q: string) => void;
  /** A specialty picked from the suggestions. */
  onSpecialty: (value: string) => void;
}) {
  const typed = text.trim();
  const suggestions: Suggestion[] = typed
    ? suggestSpecialties(typed).map((s) => ({ value: `specialty:${s.value}`, label: s.label, hint: "Specialty" }))
    : POPULAR.map((p) => ({ value: `q:${p}`, label: p, icon: <SearchIcon className="size-4 text-text-tertiary" /> }));

  return (
    <ComboField
      label="What's on your mind?"
      value={text}
      onValueChange={onText}
      onSubmit={() => onSearch(typed)}
      onPick={(s) => {
        if (s.value.startsWith("specialty:")) {
          onText("");
          onSpecialty(s.value.slice("specialty:".length));
        } else {
          onText(s.label);
          onSearch(s.label);
        }
      }}
      suggestions={suggestions}
      heading={typed ? undefined : "Popular searches"}
      placeholder="What would you like to work on?"
      onClear={() => {
        onText("");
        onSearch("");
      }}
    />
  );
}

/** Figma "Who feels right": the preferences chosen so far, and a way to add more. */
export function WhoFeelsRight({
  filters,
  update,
  facets,
  align = "end",
}: {
  filters: SearchFilters;
  update: (patch: Partial<SearchFilters>) => void;
  facets: Facets;
  align?: "start" | "end";
}) {
  const chosen = [
    ...filters.gender.map((g) => ({ key: `g-${g}`, label: labelOf("genders", g), icon: <UserRoundIcon className="size-3.5" /> })),
    ...filters.language.map((l) => ({ key: `l-${l}`, label: l, icon: <GlobeIcon className="size-3.5" /> })),
  ];
  const languages = Object.entries(facets.language)
    .sort((a, b) => b[1] - a[1])
    .map(([l]) => l)
    .filter((l) => !filters.language.includes(l))
    .slice(0, 8);
  const languageOptions = [...filters.language, ...languages];
  const genders = GENDERS.filter((g) => g.value !== "undisclosed");

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {chosen.slice(0, 2).map((c) => (
        <span key={c.key} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-tag border border-warm-300 bg-white px-2.5 text-[13px] font-medium text-text-secondary shadow-control">
          {c.icon}
          {c.label}
        </span>
      ))}
      {chosen.length > 2 && <span className="shrink-0 type-caption text-text-tertiary">+{chosen.length - 2}</span>}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill border border-dashed border-warm-300 px-3 text-[13px] font-medium text-text-secondary transition-colors hover:border-warm-600/50 hover:bg-white hover:text-text-primary"
          >
            <PlusIcon className="size-3.5" />
            {chosen.length ? "Edit" : "Add preferences"}
          </button>
        </PopoverTrigger>
        <PopoverContent align={align} className="flex w-[320px] flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <p className="type-overline text-text-secondary">Provider gender</p>
            <ToggleGroup
              type="multiple"
              variant="chip"
              size="chip"
              spacing={1.5}
              aria-label="Provider gender"
              value={filters.gender}
              onValueChange={(gender) => update({ gender })}
              className="flex-wrap"
            >
              {genders.map((g) => (
                <ToggleGroupItem key={g.value} value={g.value} className="h-8 px-3 text-[13px]">
                  {g.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2">
            <p className="type-overline text-text-secondary">Language</p>
            <ToggleGroup
              type="multiple"
              variant="chip"
              size="chip"
              spacing={1.5}
              aria-label="Language"
              value={filters.language}
              onValueChange={(language) => update({ language })}
              className="flex-wrap"
            >
              {languageOptions.map((l) => (
                <ToggleGroupItem key={l} value={l} className="h-8 px-3 text-[13px]">
                  {l}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
