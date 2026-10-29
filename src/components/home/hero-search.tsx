"use client";

import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import {
  BarDivider,
  BarSegment,
  FormatSwitch,
  PanelSection,
  SearchBarFrame,
  SearchPill,
  SearchSubmit,
  useSearchBar,
} from "@/components/search/bar";
import type { SessionMode } from "@/components/shared/session-mode-switch";
import { GlobeIcon, UserIcon } from "@/components/ui/hugeicons";
import { MapPinIcon, MonitorIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTrackView } from "@/lib/analytics/client";
import { searchHref } from "@/lib/search/filters";
import { stateForZip, whereForZip } from "@/lib/search/location";
import { suggestSpecialties } from "@/lib/search/text";
import { GENDERS, labelOf, stateName } from "@/lib/taxonomy";
import { isZip, type ZipPlace } from "@/lib/zip";
import { segmentLabel, segmentValue, SUGGESTIONS, topicChip, topicChipOff, topicChipOn } from "./search-styles";

// The home page search tool, wired to the results: format and ZIP, "What's on
// your mind?" and "Who feels right" preferences. Search opens /providers with
// those filters; the results page asks for a location when it's still needed.
//
// The ZIP sits with the format because it matters either way: in person it finds
// practices nearby, and online it decides who can see you at all (providers can
// only work with clients in states where they're licensed). A full ZIP names its
// place in the panel: the state at once, from the ZIP table, then the city once
// our server has looked it up (/api/place; nothing leaves the browser for any
// other host).
//
// It behaves like Airbnb's search bar, with a frosted focus pull instead of
// Airbnb's grey: opening a segment lifts it as a white pill, frosts the other
// segments over and drops one big rounded panel under the bar;
// the search button grows into "Search". A value is only cleared from inside
// the open segment (its round ✕), never from the closed bar. Every panel has
// the same shape: small headings over chips, or Airbnb's two-way toggle for
// the format. The results page's bar is built from the same parts
// (components/search/bar.tsx).

/** Most-asked session languages first. TODO(client): confirm the list. */
const LANGUAGES = ["English", "Spanish", "French", "Arabic", "Mandarin", "Portuguese", "Russian", "Hindi"];
const GENDER_OPTIONS = GENDERS.filter((g) => g.value !== "undisclosed");

type Prefs = { gender: string[]; language: string[] };
type Segment = "format" | "mind" | "prefs";

function go(mode: SessionMode, q: string, prefs: Prefs, where = "", openFilters = false) {
  const href = searchHref("/providers", {
    format: mode === "in-person" ? "in_person" : "online",
    where: where || null,
    q: q || null,
    gender: prefs.gender.length ? prefs.gender : null,
    language: prefs.language.length ? prefs.language : null,
  });
  // The results live on the app host, so this is a full page load.
  window.location.assign(openFilters ? `${href}${href.includes("?") ? "&" : "?"}open=filters` : href);
}

function DesktopSearch() {
  const [mode, setMode] = useState<SessionMode>("online");
  const [mind, setMind] = useState("");
  const [prefs, setPrefs] = useState<Prefs>({ gender: [], language: [] });
  const bar = useSearchBar<Segment>("prefs");
  const { open, setOpen, barOpen } = bar;
  const input = useRef<HTMLInputElement>(null);
  const zipField = useRef<HTMLInputElement>(null);

  // The ZIP, and our server's answer for it (kept with the ZIP it's for, so an
  // answer for an older ZIP is never shown against a newer one).
  const [zip, setZip] = useState("");
  const [reply, setReply] = useState<{ zip: string; place: ZipPlace | null; status: "found" | "unknown" | "unavailable" } | null>(null);
  useEffect(() => {
    if (!isZip(zip) || !stateForZip(zip)) return;
    const ask = new AbortController();
    const wait = window.setTimeout(() => {
      fetch(`/api/place/${zip}`, { signal: ask.signal })
        .then(async (r) => {
          if (!r.ok) return setReply({ zip, place: null, status: r.status === 404 ? "unknown" : "unavailable" });
          const { places } = (await r.json()) as { places?: ZipPlace[] };
          setReply({ zip, place: places?.[0] ?? null, status: "found" });
        })
        .catch(() => {}); // typed on, or offline: the state from the ZIP table stands
    }, 200);
    return () => {
      window.clearTimeout(wait);
      ask.abort();
    };
  }, [zip]);
  const fullZip = isZip(zip);
  const zipState = fullZip ? stateForZip(zip) : undefined;
  const answer = reply?.zip === zip ? reply : null;
  const place = answer?.place ?? null;
  const unknownZip = fullZip && (!zipState || answer?.status === "unknown");
  const where = unknownZip ? "" : whereForZip(mode === "in-person" ? "in_person" : "online", zip, place);
  /** "Brooklyn, NY", or the state until the city is known. */
  const placeLabel = place ? `${place.city}, ${place.state}` : zipState ? stateName(zipState) : "";

  // Popular topics until someone types; then the specialties that match,
  // from the taxonomy the results page searches (labels and synonyms).
  const typed = mind.trim();
  const topics = typed ? suggestSpecialties(typed, 8).map((s) => s.label) : SUGGESTIONS;
  const chosen = [...prefs.gender.map((g) => labelOf("genders", g)), ...prefs.language];
  const summary = chosen.length > 2 ? `${chosen.slice(0, 2).join(", ")} +${chosen.length - 2}` : chosen.join(", ");
  const FormatIcon = mode === "online" ? MonitorIcon : MapPinIcon;

  const openMind = () => {
    setOpen("mind");
    requestAnimationFrame(() => input.current?.focus());
  };
  // Opening the format lands in the ZIP field, ready to type (it autofocuses as
  // the panel mounts: the panel's portal arrives a step after the click).
  const openFormat = () => setOpen("format");

  const panel = (
    <>
      {open === "format" && (
        <PanelSection title="Session format">
          <FormatSwitch
            value={mode}
            onChange={(m) => {
              if (!m) return;
              setMode(m);
              // on to the ZIP until there is one, then to "What's on your mind?"
              if (fullZip) openMind();
              else zipField.current?.focus();
            }}
          />
        </PanelSection>
      )}

      {open === "format" && (
        // TODO(client): new copy: "ZIP code", its placeholder, the in-person
        // note, "Providers licensed in …" and the unknown-ZIP line. The online
        // note is the results page's own.
        <PanelSection icon={<MapPinIcon />} title="ZIP code" className="mt-5 border-t border-warm-200 pt-5">
          <Input
            ref={zipField}
            autoFocus // the panel was opened to fill this field in
            aria-label="ZIP code"
            aria-describedby="hero-zip-note"
            aria-invalid={unknownZip || undefined}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="e.g. 11201"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              openMind();
            }}
            className="text-sm"
          />
          <p id="hero-zip-note" aria-live="polite" className="flex min-h-4 items-center gap-1.5 text-xs leading-4 text-warm-500">
            {unknownZip ? (
              <span className="text-red-700">We couldn&apos;t find that ZIP code.</span>
            ) : fullZip && zipState ? (
              <>
                <MapPinIcon className="size-3.5 shrink-0 text-brand-primary" />
                <span className="font-medium text-warm-900">{placeLabel}</span>
                {mode === "online" && <span>· Providers licensed in {stateName(zipState)}</span>}
              </>
            ) : mode === "online" ? (
              "Providers can only see clients in states where they're licensed."
            ) : (
              "We'll look for practices near you."
            )}
          </p>
        </PanelSection>
      )}

      {open === "mind" && (
        // TODO(client): new heading "Specialties" while typing, and the no-match line.
        <PanelSection title={typed ? "Specialties" : "Popular searches"}>
          {topics.length ? (
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => {
                const on = t.toLowerCase() === typed.toLowerCase();
                return (
                  <button
                    key={t}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setMind(t);
                      setOpen("prefs");
                    }}
                    className={cn(topicChip, on ? topicChipOn : topicChipOff)}
                  >
                    {t}
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
              value={prefs.gender}
              onValueChange={(gender) => setPrefs({ ...prefs, gender })}
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
              value={prefs.language}
              onValueChange={(language) => setPrefs({ ...prefs, language })}
              className="flex-wrap"
            >
              {LANGUAGES.map((l) => (
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
      label="Find a provider"
      onSubmit={() => go(mode, mind.trim(), prefs, where)}
      panel={panel}
      // The row needs a wide container; below @3xl the phone pill covers it.
      className="hidden max-w-[850px] @3xl:flex"
    >
      <div {...bar.slot("format")} className="h-full w-[200px] shrink-0">
        <BarSegment
          active={open === "format"}
          barOpen={barOpen}
          className="w-full"
          onClear={
            zip
              ? () => {
                  setZip("");
                  zipField.current?.focus();
                }
              : undefined
          }
        >
          <button
            type="button"
            aria-expanded={open === "format"}
            onClick={openFormat}
            className="flex h-full min-w-0 flex-1 flex-col justify-center pr-6 pl-8 text-left"
          >
            <span className={segmentLabel}>Session format</span>
            <span className={cn(segmentValue, "flex items-center gap-1.5 font-medium text-warm-900")}>
              <FormatIcon className="size-3.5 shrink-0 text-brand-primary" />
              {/* the format, then where once there's a ZIP, short enough for the
                  segment ("Online · Brooklyn"); the panel names it in full */}
              <span className="truncate">
                {mode === "online" ? "Online" : "In-person"}
                {fullZip && !unknownZip && ` · ${place?.city ?? zipState}`}
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
                  input.current?.focus();
                }
              : undefined
          }
        >
          <div className="flex h-full min-w-0 flex-1 flex-col justify-center px-6" onClick={openMind}>
            <label htmlFor="hero-mind" className={segmentLabel}>
              What&apos;s on your mind?
            </label>
            <input
              id="hero-mind"
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
          onClear={chosen.length ? () => setPrefs({ gender: [], language: [] }) : undefined}
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

export function HeroSearch() {
  useTrackView("home");
  return (
    <>
      {/* Phones: one pill, opening the results with the filters drawer, where
          format and the rest are chosen. */}
      <SearchPill
        title="Start search"
        detail="Press to get started"
        onClick={() => go("online", "", { gender: [], language: [] }, "", true)}
        className="max-w-[440px] @3xl:hidden"
      />
      <DesktopSearch />
    </>
  );
}
