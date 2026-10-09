"use client";

import { cn } from "cn";
import { GlobeIcon, UserRoundIcon, XCircleIcon } from "lucide-react";
import { useRef, useState } from "react";
import { SessionModeSwitch, type SessionMode } from "@/components/shared/session-mode-switch";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { searchHref } from "@/lib/search/filters";
import { GENDERS, labelOf } from "@/lib/taxonomy";

// The home page search tool, wired to the results: format, "What's on your
// mind?" (Figma Assets 656:2889: typing completes a suggestion, chosen text
// becomes a pill) and "Who feels right" preferences. Search opens /providers
// with those filters; the results page asks for a location when it's needed.

/** Figma's "What's on your mind?" suggestions. */
const SUGGESTIONS = ["Anxiety", "Trauma", "PTSD", "Depression", "Family issues", "Cultural changes"];
/** Most-asked session languages first. TODO(client): confirm the list. */
const LANGUAGES = ["English", "Spanish", "French", "Arabic", "Mandarin", "Portuguese", "Russian", "Hindi"];
const GENDER_OPTIONS = GENDERS.filter((g) => g.value !== "undisclosed");

// Shared surface for the search: white, hairline ring, soft lift — sits on the
// paper like everything else instead of a grey slab.
const searchSurface =
  "bg-white ring-1 ring-warm-200 shadow-[0_1px_2px_rgb(28_25_23/0.04),0_24px_56px_-28px_rgb(28_25_23/0.22)]";

type Prefs = { gender: string[]; language: string[] };

function go(mode: SessionMode, q: string, prefs: Prefs, openFilters = false) {
  const href = searchHref("/providers", {
    format: mode === "in-person" ? "in_person" : "online",
    q: q || null,
    gender: prefs.gender.length ? prefs.gender : null,
    language: prefs.language.length ? prefs.language : null,
  });
  // The results live on the app host, so this is a full page load.
  window.location.assign(openFilters ? `${href}${href.includes("?") ? "&" : "?"}open=filters` : href);
}

function Divider() {
  return <div aria-hidden className="my-5 w-px self-stretch bg-warm-200" />;
}

function MindField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const typed = text.trim().toLowerCase();
  const match = typed ? SUGGESTIONS.find((s) => s.toLowerCase().startsWith(typed)) : undefined;
  const ghost = match && text.length < match.length ? match.slice(text.length) : "";

  const commit = (v: string) => {
    onChange(v.trim());
    setText("");
    setOpen(false);
  };

  return (
    <div
      className="relative flex min-w-0 flex-1 cursor-text flex-col justify-center gap-1 self-stretch rounded-[32px] px-7 py-5 transition-colors duration-300 hover:bg-warm-50"
      onClick={() => input.current?.focus()}
    >
      <label htmlFor="hero-mind" className="text-lg font-medium text-text-primary">
        What&apos;s on your mind?
      </label>
      {value ? (
        <span className="inline-flex w-fit max-w-full items-center gap-2 rounded-tag border border-warm-300 bg-white py-1 pr-1.5 pl-3 text-md font-medium text-text-primary shadow-control">
          <span className="truncate">{value}</span>
          <button
            type="button"
            aria-label={`Clear “${value}”`}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              requestAnimationFrame(() => input.current?.focus());
            }}
            className="flex size-6 shrink-0 items-center justify-center rounded-full"
          >
            <XCircleIcon className="size-4 fill-warm-900 text-white" />
          </button>
        </span>
      ) : (
        <div className="relative">
          <input
            id="hero-mind"
            ref={input}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if ((e.key === "Tab" || e.key === "ArrowRight") && ghost) {
                e.preventDefault();
                setText(match!);
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (match || text.trim()) commit(match && ghost ? match : text);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="What would you like to work on?"
            autoComplete="off"
            aria-describedby={open ? "hero-mind-suggestions" : undefined}
            className="w-full bg-transparent text-lg text-text-primary outline-none placeholder:text-text-placeholder"
          />
          {ghost && (
            <span aria-hidden className="pointer-events-none absolute inset-0 truncate text-lg whitespace-pre">
              <span className="invisible">{text}</span>
              <span className="text-text-placeholder">{ghost}</span>
            </span>
          )}
        </div>
      )}
      {open && !value && (
        <div
          id="hero-mind-suggestions"
          className={cn("absolute top-[calc(100%+10px)] left-0 z-30 flex w-[min(440px,100%)] flex-col gap-3 rounded-[24px] p-5", searchSurface)}
        >
          <p className="type-small text-text-tertiary">Popular searches</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(s)}
                className={cn(
                  "inline-flex h-8 items-center rounded-tag border px-3 text-sm font-medium shadow-control transition-colors",
                  s === match ? "border-warm-900 bg-warm-900 text-white" : "border-warm-300 bg-white text-text-secondary hover:border-warm-600 hover:text-text-primary",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Preferences({ prefs, onChange }: { prefs: Prefs; onChange: (p: Prefs) => void }) {
  const chosen = [
    ...prefs.gender.map((g) => ({ key: g, label: labelOf("genders", g), icon: <UserRoundIcon className="size-3.5" /> })),
    ...prefs.language.map((l) => ({ key: l, label: l, icon: <GlobeIcon className="size-3.5" /> })),
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chosen.slice(0, 2).map((c) => (
        <span key={c.key} className="inline-flex h-9 items-center gap-1.5 rounded-tag border border-warm-300 bg-white px-3 text-sm font-medium text-text-secondary shadow-control">
          {c.icon}
          {c.label}
        </span>
      ))}
      {chosen.length > 2 && <span className="type-small text-text-tertiary">+{chosen.length - 2}</span>}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 w-fit items-center gap-1.5 rounded-pill border border-dashed border-warm-300 px-3.5 text-md font-medium text-text-secondary transition-colors hover:border-warm-600/50 hover:bg-white hover:text-text-primary"
          >
            <PlusIcon className="size-4" />
            {chosen.length ? "Edit" : "Add preferences"}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-[340px] flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <p className="type-overline text-text-secondary">Provider gender</p>
            <ToggleGroup type="multiple" variant="chip" size="chip" spacing={1.5} aria-label="Provider gender" value={prefs.gender} onValueChange={(gender) => onChange({ ...prefs, gender })} className="flex-wrap">
              {GENDER_OPTIONS.map((g) => (
                <ToggleGroupItem key={g.value} value={g.value} className="h-8 px-3 text-[13px]">
                  {g.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2">
            <p className="type-overline text-text-secondary">Language</p>
            <ToggleGroup type="multiple" variant="chip" size="chip" spacing={1.5} aria-label="Language" value={prefs.language} onValueChange={(language) => onChange({ ...prefs, language })} className="flex-wrap">
              {LANGUAGES.map((l) => (
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

function MobileSearchTrigger({ mode, setMode }: { mode: SessionMode; setMode: (m: SessionMode) => void }) {
  return (
    <div className={`w-full max-w-[440px] rounded-[30px] p-2 xl:hidden ${searchSurface}`}>
      <div className="flex justify-center px-2 pt-1.5 pb-2">
        <SessionModeSwitch size="sm" value={mode} onChange={setMode} />
      </div>
      <button
        type="button"
        onClick={() => go(mode, "", { gender: [], language: [] }, true)}
        className="group flex w-full items-center justify-between gap-3 rounded-[24px] bg-warm-50 py-3.5 pr-3 pl-5 text-left ring-1 ring-warm-200/70 ring-inset transition-colors duration-300 hover:bg-warm-100/70"
      >
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 type-body font-medium text-text-primary">
            <SearchIcon className="size-4 text-text-secondary" />
            Start search
          </span>
          <span className="type-body text-text-placeholder">Press to get started</span>
        </span>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-control transition-[scale,background-color] duration-300 ease-out-soft group-hover:scale-105 group-hover:bg-brand-primary-hover">
          <SearchIcon className="size-[18px]" />
        </span>
      </button>
    </div>
  );
}

export function HeroSearch() {
  const [mode, setMode] = useState<SessionMode>("online");
  const [mind, setMind] = useState("");
  const [prefs, setPrefs] = useState<Prefs>({ gender: [], language: [] });

  return (
    <>
      <MobileSearchTrigger mode={mode} setMode={setMode} />
      {/* The row layout needs genuinely wide viewports. Below xl the compact
          trigger covers the whole range instead. */}
      <form
        role="search"
        aria-label="Find a provider"
        onSubmit={(e) => {
          e.preventDefault();
          go(mode, mind, prefs);
        }}
        className={`hidden w-full max-w-[1180px] items-center gap-2 rounded-[40px] p-2.5 xl:flex ${searchSurface}`}
      >
        <div className="flex shrink-0 items-center self-stretch rounded-[32px] px-5">
          <SessionModeSwitch value={mode} onChange={setMode} />
        </div>

        <Divider />
        <MindField value={mind} onChange={setMind} />
        <Divider />

        <div className="flex shrink-0 flex-col justify-center gap-2 self-stretch rounded-[32px] px-7 py-5 transition-colors duration-300 hover:bg-warm-50">
          <p className="text-lg font-medium text-text-primary">Who feels right</p>
          <Preferences prefs={prefs} onChange={setPrefs} />
        </div>

        <button
          type="submit"
          aria-label="Search"
          className="ml-2 flex size-[84px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-[0_10px_24px_-10px_rgb(192_16_72/0.6)] transition-[scale,background-color] duration-300 ease-out-soft hover:scale-[1.04] hover:bg-brand-primary-hover active:scale-[0.97]"
        >
          <SearchIcon className="size-7" />
        </button>
      </form>
    </>
  );
}
