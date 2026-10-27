"use client";

import { cn } from "cn";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SessionMode } from "@/components/shared/session-mode-switch";
import { GlobeIcon, UserIcon, XIcon } from "@/components/ui/hugeicons";
import { MapPinIcon, MonitorIcon, SearchIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTrackView } from "@/lib/analytics/client";
import { searchHref } from "@/lib/search/filters";
import { stateForZip, whereForZip } from "@/lib/search/location";
import { suggestSpecialties } from "@/lib/search/text";
import { GENDERS, labelOf, stateName } from "@/lib/taxonomy";
import { isZip, type ZipPlace } from "@/lib/zip";
import {
  panelHeading,
  searchLift,
  searchPanel,
  searchSurface,
  segmentFrost,
  segmentLabel,
  segmentLift,
  segmentValue,
  SUGGESTIONS,
  topicChip,
  topicChipOff,
  topicChipOn,
} from "./search-styles";

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
// the format.

/** Most-asked session languages first. TODO(client): confirm the list. */
const LANGUAGES = ["English", "Spanish", "French", "Arabic", "Mandarin", "Portuguese", "Russian", "Hindi"];
const GENDER_OPTIONS = GENDERS.filter((g) => g.value !== "undisclosed");
const FORMATS: { value: SessionMode; label: string; Icon: typeof MonitorIcon }[] = [
  { value: "online", label: "Online", Icon: MonitorIcon },
  { value: "in-person", label: "In-person", Icon: MapPinIcon },
];

type Prefs = { gender: string[]; language: string[] };
type Segment = "format" | "mind" | "prefs";

// The bar's measurements and why (Airbnb's, with concentric corners) are with
// the shared styles in search-styles.ts.

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

/** One segment of the bar. Closed bar: white, a soft grey hover. Open bar: the
 *  open segment lifts as a white pill and the others frost over (a soft blur
 *  and fade, a focus pull rather than greying them), clearing when hovered. */
function Segment({
  active,
  barOpen,
  className,
  onClear,
  children,
  after,
}: {
  active: boolean;
  barOpen: boolean;
  className?: string;
  /** Shown as a round ✕ only while this segment is open and has a value. */
  onClear?: () => void;
  children: ReactNode;
  /** Sits after the ✕ (the search button, in the last segment). */
  after?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/seg relative flex h-full min-w-0 items-center rounded-[24px] transition-[background-color,box-shadow] duration-200",
        active ? segmentLift : "hover:bg-warm-100",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-full min-w-0 flex-1 transition-[filter,opacity] duration-300 ease-out-soft",
          barOpen && !active && cn(segmentFrost, "group-hover/seg:opacity-100 group-hover/seg:blur-[0px]"),
        )}
      >
        {children}
      </div>
      {active && onClear && (
        <button
          type="button"
          aria-label="Clear"
          onClick={onClear}
          className={cn(
            "flex size-6 shrink-0 animate-in items-center justify-center rounded-full bg-warm-200 text-warm-900 duration-200 zoom-in-50 hover:bg-warm-300",
            after ? "mr-2" : "mr-4",
          )}
        >
          <XIcon className="size-3" strokeWidth={2.5} />
        </button>
      )}
      {after}
    </div>
  );
}

/** One block of a panel: a small heading (with an icon) over its choices. */
function PanelSection({ icon, title, children, className }: { icon?: ReactNode; title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className={panelHeading}>
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function Divider({ hidden }: { hidden: boolean }) {
  return <div aria-hidden className={cn("h-8 w-px shrink-0 bg-warm-200 transition-opacity duration-200", hidden && "opacity-0")} />;
}

function DesktopSearch() {
  const [mode, setMode] = useState<SessionMode>("online");
  const [mind, setMind] = useState("");
  const [prefs, setPrefs] = useState<Prefs>({ gender: [], language: [] });
  const [open, setOpenState] = useState<Segment | null>(null);
  // A separator fades while either segment beside it is hovered or open, so
  // the segment's rounded highlight never runs into a line (as on Airbnb).
  const [hovered, setHovered] = useState<Segment | null>(null);
  const touches = (...pair: Segment[]) => [open, hovered].some((s) => s !== null && pair.includes(s));
  const hover = (segment: Segment) => ({
    onMouseEnter: () => setHovered(segment),
    onMouseLeave: () => setHovered((h) => (h === segment ? null : h)),
  });
  // The panel hangs from the whole bar: under the open segment's left edge,
  // and from the right edge for the last one (as Airbnb's "Who").
  const [anchorOffset, setAnchorOffset] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const zipField = useRef<HTMLInputElement>(null);
  const segments = useRef<Record<Segment, HTMLDivElement | null>>({ format: null, mind: null, prefs: null });

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
  const barOpen = open !== null;

  const setOpen = (segment: Segment | null) => {
    setOpenState(segment);
    setAnchorOffset(segment && segment !== "prefs" ? (segments.current[segment]?.offsetLeft ?? 0) : 0);
  };

  const openMind = () => {
    setOpen("mind");
    requestAnimationFrame(() => input.current?.focus());
  };
  // Opening the format lands in the ZIP field, ready to type (it autofocuses as
  // the panel mounts: the panel's portal arrives a step after the click).
  const openFormat = () => setOpen("format");

  return (
    <Popover open={barOpen} onOpenChange={(o) => !o && setOpen(null)}>
      <PopoverAnchor asChild>
        <form
          ref={form}
          role="search"
          aria-label="Find a provider"
          onSubmit={(e) => {
            e.preventDefault();
            go(mode, mind.trim(), prefs, where);
          }}
          className={cn(
            "relative hidden h-[66px] w-full max-w-[850px] items-center rounded-[25px] transition-[background-color,box-shadow] duration-200 @3xl:flex",
            searchSurface,
            barOpen && searchLift,
          )}
        >
          <div ref={(el) => void (segments.current.format = el)} {...hover("format")} className="h-full w-[200px] shrink-0">
            <Segment
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
            </Segment>
          </div>

          <Divider hidden={touches("format", "mind")} />

          <div ref={(el) => void (segments.current.mind = el)} {...hover("mind")} className="h-full min-w-0 flex-1">
            <Segment
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
                  className={cn(
                    segmentValue,
                    "w-full bg-transparent font-medium text-warm-900 outline-none placeholder:font-normal placeholder:text-warm-500",
                  )}
                />
              </div>
            </Segment>
          </div>

          <Divider hidden={touches("mind", "prefs")} />

          <div ref={(el) => void (segments.current.prefs = el)} {...hover("prefs")} className="h-full w-[290px] shrink-0">
            <Segment
              active={open === "prefs"}
              barOpen={barOpen}
              className="w-full pr-2"
              onClear={chosen.length ? () => setPrefs({ gender: [], language: [] }) : undefined}
              after={
                // Grows into a labelled pill while the bar is open, as on Airbnb.
                <button
                  type="submit"
                  aria-label="Search"
                  className={cn(
                    "flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[16px] bg-brand-primary text-sm font-medium text-white transition-[width,background-color] duration-300 ease-out-soft hover:bg-brand-primary-hover",
                    barOpen ? "w-[100px]" : "w-12",
                  )}
                >
                  <SearchIcon className="size-4 shrink-0" />
                  {barOpen && <span aria-hidden>Search</span>}
                </button>
              }
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
            </Segment>
          </div>
        </form>
      </PopoverAnchor>

      <PopoverContent
        align={open === "prefs" ? "end" : "start"}
        alignOffset={anchorOffset}
        sideOffset={12}
        // Keep typing in the field; the bar itself isn't "outside".
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (form.current?.contains(e.target as Node)) e.preventDefault();
        }}
        // Portalled out of the hero, so it takes the hero's Inter itself.
        className={cn(searchPanel, "font-[family-name:var(--font-inter)]")}
      >
        {open === "format" && (
          <PanelSection title="Session format">
            {/* Airbnb's two-way toggle (its Dates / Flexible): a grey 44px
                track, the chosen side a white 36px pill with a hairline. */}
            <div role="radiogroup" aria-label="Session format" className="flex h-11 rounded-[16px] bg-warm-200/70 p-1">
              {FORMATS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setMode(value);
                    // on to the ZIP until there is one, then to "What's on your mind?"
                    if (fullZip) openMind();
                    else zipField.current?.focus();
                  }}
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[12px] border text-sm font-medium transition-[background-color,border-color,box-shadow,color] duration-200",
                    mode === value
                      ? "border-warm-300 bg-white text-warm-900 shadow-[0_1px_2px_rgb(0_0_0/0.06)]"
                      : "border-transparent text-warm-600 hover:text-warm-900",
                  )}
                >
                  <Icon className={cn("size-3.5", mode === value && "text-brand-primary")} />
                  {label}
                </button>
              ))}
            </div>
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
      </PopoverContent>
    </Popover>
  );
}

/** Phones: one 56px pill (Airbnb's mobile search), opening the results with
 *  the filters drawer, where format and the rest are chosen. */
function MobileSearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => go("online", "", { gender: [], language: [] }, "", true)}
      className={cn(
        "group flex h-14 w-full max-w-[440px] items-center gap-3 rounded-[21px] pr-2 pl-5 text-left transition-colors hover:bg-warm-50 @3xl:hidden",
        searchSurface,
      )}
    >
      <SearchIcon className="size-4 shrink-0 text-warm-900" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm leading-[18px] font-medium text-warm-900">Start search</span>
        <span className="text-xs leading-4 text-warm-500">Press to get started</span>
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-brand-primary text-white transition-colors group-hover:bg-brand-primary-hover">
        <SearchIcon className="size-4" />
      </span>
    </button>
  );
}

export function HeroSearch() {
  useTrackView("home");
  return (
    <>
      <MobileSearchTrigger />
      {/* The row needs a wide container; below @3xl the pill above covers it. */}
      <DesktopSearch />
    </>
  );
}
