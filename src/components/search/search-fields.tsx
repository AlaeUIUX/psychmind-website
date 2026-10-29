"use client";

import { cn } from "cn";
import { HashIcon, SearchIcon } from "@/components/ui/hugeicons";
import { useMemo } from "react";
import { MapPinIcon } from "@/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SearchFilters } from "@/lib/search/filters";
import { parsePlace } from "@/lib/search/location";
import { suggestSpecialties } from "@/lib/search/text";
import { US_STATES } from "@/lib/taxonomy";
import { SUGGESTIONS } from "@/components/home/search-styles";
import { ComboField, type Suggestion } from "./combo-field";

// The search inputs, shared by the search bar's panel, the phone drawer and
// the "add your location" prompt over the results.
// Field labels are Figma copy; placeholders and suggestion headings are new.
// TODO(client): placeholders, "Popular searches", "Your state".

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
      <SelectTrigger id={id} size="sm" aria-label="Your state" className={cn("h-11 w-full text-sm", className)}>
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
    : SUGGESTIONS.map((p) => ({ value: `q:${p}`, label: p, icon: <SearchIcon className="size-4 text-text-tertiary" /> }));

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
