"use client";

import { cn } from "cn";
import { useRef, useState } from "react";
import { segmentLabel, segmentValue, SUGGESTIONS, topicChip, topicChipOff, topicChipOn } from "@/components/home/search-styles";
import { GlobeIcon, UserIcon } from "@/components/ui/hugeicons";
import { MapPinIcon, MonitorIcon } from "@/components/ui/icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Facets } from "@/lib/search/engine";
import type { SearchFilters } from "@/lib/search/filters";
import { parsePlace } from "@/lib/search/location";
import { suggestSpecialties } from "@/lib/search/text";
import { GENDERS, labelOf } from "@/lib/taxonomy";
import { BarDivider, BarSegment, FormatSwitch, PanelSection, SearchBarFrame, SearchSubmit, useSearchBar } from "./bar";
import { StateSelect, WhereInput } from "./search-fields";
import { useSearch } from "./use-search";

// The search bar over the results (Figma S1): the home page's bar, built from
// the same parts (bar.tsx), so arriving here feels like the same bar with your
// choices in it. Session format holds "Where?" (as the home bar holds the ZIP),
// then "What's on your mind?" and "Who feels right". Choosing Online turns
// "Where?" into a state picker, since providers can only see clients in states
// where they're licensed. There's always a format (Online by default, as on the
// home bar). Typed text waits for Enter or the search button; everything else
// applies at once.

type Segment = "format" | "mind" | "prefs";
const GENDER_OPTIONS = GENDERS.filter((g) => g.value !== "undisclosed");

export const toMode = (f: SearchFilters["format"]) => (f === "in_person" ? "in-person" : "online");
export const fromMode = (m: "in-person" | "online"): SearchFilters["format"] => (m === "in-person" ? "in_person" : "online");

export function SearchBar({ cities, facets }: { cities: string[]; facets: Facets }) {
  const { filters, set } = useSearch();
  const bar = useSearchBar<Segment>("prefs");
  const { open, setOpen, barOpen } = bar;
  const input = useRef<HTMLInputElement>(null);
  const [where, setWhere] = useState(filters.where);
  const [mind, setMind] = useState(filters.q);
  const [seen, setSeen] = useState({ where: filters.where, q: filters.q });
  if (seen.where !== filters.where || seen.q !== filters.q) {
    // The URL changed underneath (Clear all, a removed chip, Back).
    setSeen({ where: filters.where, q: filters.q });
    setWhere(filters.where);
    setMind(filters.q);
  }

  const mode = toMode(filters.format);
  const online = filters.format === "online";
  const place = parsePlace(filters.where);
  const FormatIcon = mode === "in-person" ? MapPinIcon : MonitorIcon;
  const typed = mind.trim();
  const topics = typed
    ? suggestSpecialties(typed, 8).map((s) => ({ label: s.label, specialty: s.value as string | undefined }))
    : SUGGESTIONS.map((label) => ({ label, specialty: undefined }));
  const chosen = [...filters.gender.map((g) => labelOf("genders", g)), ...filters.language];
  const summary = chosen.length > 2 ? `${chosen.slice(0, 2).join(", ")} +${chosen.length - 2}` : chosen.join(", ");
  // The languages providers here speak, most first, after the chosen ones.
  const languages = [
    ...filters.language,
    ...Object.entries(facets.language)
      .sort((a, b) => b[1] - a[1])
      .map(([l]) => l)
      .filter((l) => !filters.language.includes(l))
      .slice(0, 8),
  ];

  const openMind = () => {
    setOpen("mind");
    requestAnimationFrame(() => input.current?.focus());
  };

  const panel = (
    <>
      {open === "format" && (
        <>
          <PanelSection title="Session format">
            <FormatSwitch value={mode} onChange={(m) => set({ format: fromMode(m) })} />
          </PanelSection>
          <PanelSection icon={<MapPinIcon />} title="Where?" className="mt-5 border-t border-warm-200 pt-5">
            {online ? (
              <StateSelect id="search-state" value={filters.where} onChange={(code) => set({ where: code })} />
            ) : (
              <WhereInput format={filters.format} text={where} onText={setWhere} onApply={(w) => set({ where: w })} cities={cities} />
            )}
            <p className="text-xs leading-4 text-warm-500">
              {online ? "Providers can only see clients in states where they're licensed." : "We'll look for practices near you."}
            </p>
          </PanelSection>
        </>
      )}

      {open === "mind" && (
        // TODO(client): new heading "Specialties" while typing, and the no-match line (the home bar's).
        <PanelSection title={typed ? "Specialties" : "Popular searches"}>
          {topics.length ? (
            <div className="flex flex-wrap gap-1.5">
              {topics.map(({ label, specialty }) => {
                const on = specialty ? filters.specialty.includes(specialty) : label.toLowerCase() === filters.q.toLowerCase();
                return (
                  <button
                    key={label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (specialty) {
                        // A specialty becomes its filter (and its chip over the results).
                        setMind("");
                        set({ q: "", specialty: filters.specialty.includes(specialty) ? filters.specialty : [...filters.specialty, specialty] });
                      } else {
                        setMind(label);
                        set({ q: label });
                      }
                      setOpen(null);
                    }}
                    className={cn(topicChip, on ? topicChipOn : topicChipOff)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-warm-500">Press Enter to search “{typed}”</p>
          )}
        </PanelSection>
      )}

      {open === "prefs" && (
        <div className="flex flex-col">
          <PanelSection icon={<UserIcon />} title="Provider gender" className="pb-5">
            <ToggleGroup
              type="multiple"
              variant="chip"
              size="chip"
              spacing={1.5}
              aria-label="Provider gender"
              value={filters.gender}
              onValueChange={(gender) => set({ gender })}
              className="flex-wrap"
            >
              {GENDER_OPTIONS.map((g) => (
                <ToggleGroupItem key={g.value} value={g.value} className="h-8 px-3 text-[13px]">
                  {g.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </PanelSection>
          <PanelSection icon={<GlobeIcon />} title="Language" className="border-t border-warm-200 pt-5">
            <ToggleGroup
              type="multiple"
              variant="chip"
              size="chip"
              spacing={1.5}
              aria-label="Language"
              value={filters.language}
              onValueChange={(language) => set({ language })}
              className="flex-wrap"
            >
              {languages.map((l) => (
                <ToggleGroupItem key={l} value={l} className="h-8 px-3 text-[13px]">
                  {l}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </PanelSection>
        </div>
      )}
    </>
  );

  return (
    <SearchBarFrame
      bar={bar}
      label="Search providers"
      onSubmit={() => {
        set({ where: online ? filters.where : where.trim(), q: typed });
        setOpen(null);
      }}
      panel={panel}
    >
      <div {...bar.slot("format")} className="h-full w-[220px] shrink-0">
        <BarSegment
          active={open === "format"}
          barOpen={barOpen}
          className="w-full"
          onClear={
            filters.where
              ? () => {
                  setWhere("");
                  set({ where: "" });
                }
              : undefined
          }
        >
          <button
            type="button"
            aria-expanded={open === "format"}
            onClick={() => setOpen("format")}
            className="flex h-full min-w-0 flex-1 flex-col justify-center pr-6 pl-8 text-left"
          >
            <span className={segmentLabel}>Session format</span>
            <span className={cn(segmentValue, "flex items-center gap-1.5 font-medium text-warm-900")}>
              <FormatIcon className="size-3.5 shrink-0 text-brand-primary" />
              {/* the format, then where ("In-person · Miami"); the panel names it in full */}
              <span className="truncate">
                {online ? "Online" : "In-person"}
                {place && ` · ${place.city ?? place.state ?? place.zip}`}
              </span>
            </span>
          </button>
        </BarSegment>
      </div>

      <BarDivider hidden={bar.touches("format", "mind")} />

      <div {...bar.slot("mind")} className="h-full min-w-0 flex-1">
        <BarSegment
          active={open === "mind"}
          barOpen={barOpen}
          className="w-full cursor-text"
          onClear={
            mind
              ? () => {
                  setMind("");
                  if (filters.q) set({ q: "" });
                  input.current?.focus();
                }
              : undefined
          }
        >
          <div className="flex h-full min-w-0 flex-1 flex-col justify-center px-6" onClick={openMind}>
            <label htmlFor="search-mind" className={segmentLabel}>
              What&apos;s on your mind?
            </label>
            <input
              id="search-mind"
              ref={input}
              value={mind}
              onChange={(e) => setMind(e.target.value)}
              onFocus={() => setOpen("mind")}
              placeholder="What would you like to work on?"
              autoComplete="off"
              className={cn(segmentValue, "w-full bg-transparent font-medium text-warm-900 outline-none placeholder:font-normal placeholder:text-warm-500")}
            />
          </div>
        </BarSegment>
      </div>

      <BarDivider hidden={bar.touches("mind", "prefs")} />

      <div {...bar.slot("prefs")} className="h-full w-[290px] shrink-0">
        <BarSegment
          active={open === "prefs"}
          barOpen={barOpen}
          className="w-full pr-2"
          onClear={chosen.length ? () => set({ gender: [], language: [] }) : undefined}
          after={<SearchSubmit open={barOpen} />}
        >
          <button
            type="button"
            aria-expanded={open === "prefs"}
            onClick={() => setOpen("prefs")}
            className="flex h-full min-w-0 flex-1 flex-col justify-center pr-2 pl-6 text-left"
          >
            <span className={segmentLabel}>Who feels right</span>
            <span className={cn(segmentValue, chosen.length ? "font-medium text-warm-900" : "text-warm-500")}>
              {chosen.length ? summary : "Add preferences"}
            </span>
          </button>
        </BarSegment>
      </div>
    </SearchBarFrame>
  );
}
