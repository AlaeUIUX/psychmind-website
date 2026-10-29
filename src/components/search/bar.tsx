"use client";

import { cn } from "cn";
import { useRef, useState, type ReactNode } from "react";
import { panelHeading, searchLift, searchPanel, searchSurface, segmentFrost, segmentLift } from "@/components/home/search-styles";
import type { SessionMode } from "@/components/shared/session-mode-switch";
import { XIcon } from "@/components/ui/hugeicons";
import { MapPinIcon, MonitorIcon, SearchIcon } from "@/components/ui/icons";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// The search bar's parts, shared by the home page and the results page so
// it's one bar wherever it stands: the same 66px frame, label-over-value
// segments, frosted focus pull, panel, two-way format switch, search button
// and phone pill. Measurements and why are in home/search-styles.ts.

export type SearchBarState<S extends string> = ReturnType<typeof useSearchBar<S>>;

/** Which segment is open or hovered, and where the panel hangs from: under the
 *  open segment's left edge, and from the right edge for the last one (as
 *  Airbnb's "Who"). */
export function useSearchBar<S extends string>(last: S) {
  const [open, setOpenState] = useState<S | null>(null);
  const [hovered, setHovered] = useState<S | null>(null);
  const [anchorOffset, setAnchorOffset] = useState(0);
  const segments = useRef<Partial<Record<S, HTMLDivElement | null>>>({});
  const setOpen = (segment: S | null) => {
    setOpenState(segment);
    setAnchorOffset(segment && segment !== last ? (segments.current[segment]?.offsetLeft ?? 0) : 0);
  };
  return {
    open,
    last,
    barOpen: open !== null,
    anchorOffset,
    setOpen,
    /** A separator fades while either segment beside it is hovered or open, so
     *  the segment's rounded highlight never runs into a line (as on Airbnb). */
    touches: (...pair: S[]) => [open, hovered].some((s) => s !== null && pair.includes(s)),
    /** Props for a segment's wrapper: it's measured for the panel and tracks hover. */
    slot: (segment: S) => ({
      ref: (el: HTMLDivElement | null) => void (segments.current[segment] = el),
      onMouseEnter: () => setHovered(segment),
      onMouseLeave: () => setHovered((h) => (h === segment ? null : h)),
    }),
  };
}

/** The bar (a search form) and its one panel, which drops under it while a
 *  segment is open. */
export function SearchBarFrame<S extends string>({
  bar,
  label,
  onSubmit,
  panel,
  className,
  children,
}: {
  bar: SearchBarState<S>;
  /** The form's accessible name. */
  label: string;
  onSubmit: () => void;
  panel: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <Popover open={bar.barOpen} onOpenChange={(o) => !o && bar.setOpen(null)}>
      <PopoverAnchor asChild>
        <form
          ref={form}
          role="search"
          aria-label={label}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className={cn(
            "relative flex h-[66px] w-full items-center rounded-[25px] transition-[background-color,box-shadow] duration-200",
            searchSurface,
            bar.barOpen && searchLift,
            className,
          )}
        >
          {children}
        </form>
      </PopoverAnchor>

      <PopoverContent
        align={bar.open === bar.last ? "end" : "start"}
        alignOffset={bar.anchorOffset}
        sideOffset={12}
        // Keep typing in the field; the bar itself isn't "outside".
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (form.current?.contains(e.target as Node)) e.preventDefault();
        }}
        // Portalled out of the page, so it takes the public site's Inter itself.
        className={cn(searchPanel, "font-[family-name:var(--font-inter)]")}
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

/** One segment of the bar. Closed bar: white, a soft grey hover. Open bar: the
 *  open segment lifts as a white pill and the others frost over (a soft blur
 *  and fade, a focus pull rather than greying them), clearing when hovered. */
export function BarSegment({
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

export function BarDivider({ hidden }: { hidden: boolean }) {
  return <div aria-hidden className={cn("h-8 w-px shrink-0 bg-warm-200 transition-opacity duration-200", hidden && "opacity-0")} />;
}

/** The crimson search button: 48px, and a labelled pill while the bar is open,
 *  as on Airbnb. */
export function SearchSubmit({ open }: { open: boolean }) {
  return (
    <button
      type="submit"
      aria-label="Search"
      className={cn(
        "flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[16px] bg-brand-primary text-sm font-medium text-white transition-[width,background-color] duration-300 ease-out-soft hover:bg-brand-primary-hover",
        open ? "w-[100px]" : "w-12",
      )}
    >
      <SearchIcon className="size-4 shrink-0" />
      {open && <span aria-hidden>Search</span>}
    </button>
  );
}

/** One block of a panel: a small heading (with an icon) over its choices. */
export function PanelSection({ icon, title, children, className }: { icon?: ReactNode; title: string; children: ReactNode; className?: string }) {
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

const FORMATS: { value: SessionMode; label: string; Icon: typeof MonitorIcon }[] = [
  { value: "online", label: "Online", Icon: MonitorIcon },
  { value: "in-person", label: "In-person", Icon: MapPinIcon },
];

/** Online / In-person as Airbnb's two-way toggle (its Dates / Flexible): a grey
 *  44px track, the chosen side a white 36px pill with a hairline (ToggleGroup's
 *  `segment` variant, which the portal's segmented controls share). The same
 *  control in the bar's panel, the filters column and the phone drawer. One
 *  side is always chosen: pressing it again keeps it. */
export function FormatSwitch({ value, onChange, className }: { value: SessionMode; onChange: (mode: SessionMode) => void; className?: string }) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as SessionMode)}
      aria-label="Session format"
      variant="segment"
      className={cn("grid h-11 w-full grid-cols-2", className)}
    >
      {FORMATS.map(({ value: v, label, Icon }) => (
        <ToggleGroupItem
          key={v}
          value={v}
          // Keep focus where it is (the panel's field); keyboard focus still works.
          onMouseDown={(e) => e.preventDefault()}
          className="h-9 gap-1.5 px-3 transition-[background-color,border-color,box-shadow,color] duration-200"
        >
          <Icon className={cn("size-3.5", v === value && "text-brand-primary")} />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Phones: one 56px pill (Airbnb's mobile search). */
export function SearchPill({ title, detail, onClick, className }: { title: string; detail: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("group flex h-14 w-full items-center gap-3 rounded-[21px] pr-2 pl-5 text-left transition-colors hover:bg-warm-50", searchSurface, className)}
    >
      <SearchIcon className="size-4 shrink-0 text-warm-900" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm leading-[18px] font-medium text-warm-900">{title}</span>
        <span className="truncate text-xs leading-4 text-warm-500">{detail}</span>
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-brand-primary text-white transition-colors group-hover:bg-brand-primary-hover">
        <SearchIcon className="size-4" />
      </span>
    </button>
  );
}
