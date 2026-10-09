"use client";

import { cn } from "cn";
import { CalendarIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MAX_RANGE_DAYS, RANGE_PRESETS, rangeLabel, rangeQuery, type DayRange } from "@/lib/analytics/range";

// The dashboards' one filter row (Figma D1: Last 7 days · Last 30 days ·
// Last 3 months · Custom; a dropdown on phones). It scopes everything under
// it. While the new numbers load, the old ones stay put, dimmed.

/** "2026-10-09" ↔ a local Date at midnight (the calendar works in local time). */
const toDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};
/** Two months side by side from md up, one on phones. */
const WIDE = "(min-width: 48rem)";
function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = matchMedia(WIDE);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => matchMedia(WIDE).matches,
    () => true,
  );
}

const toDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function AnalyticsFrame({ range, today, children }: { range: DayRange; today: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const go = (query: string) => startTransition(() => router.replace(`${pathname}${query}`, { scroll: false }));

  return (
    <div className="flex flex-col gap-5">
      <RangeFilter range={range} today={today} onChange={go} />
      <div aria-busy={pending} className={cn("flex flex-col gap-5 transition-opacity duration-200", pending && "pointer-events-none opacity-60")}>
        {children}
      </div>
    </div>
  );
}

function RangeFilter({ range, today, onChange }: { range: DayRange; today: string; onChange: (query: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const wide = useWide();
  const custom = range.preset === "custom";

  const pick = (value: string) => {
    if (value === "custom") {
      setDraft(custom ? { from: toDate(range.from), to: toDate(range.to) } : undefined);
      setOpen(true);
    } else if (value && value !== range.preset) {
      onChange(rangeQuery({ preset: value as DayRange["preset"] }));
    }
  };
  const apply = () => {
    if (!draft?.from) return;
    setOpen(false);
    onChange(rangeQuery({ preset: "custom", from: toDay(draft.from), to: toDay(draft.to ?? draft.from) }));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="flex flex-wrap items-center gap-3">
          {/* Phones: a dropdown. */}
          <Select value={range.preset} onValueChange={pick}>
            <SelectTrigger aria-label="Date range" className="w-auto min-w-44 bg-white sm:hidden">
              <SelectValue>{custom ? rangeLabel(range) : RANGE_PRESETS.find((p) => p.value === range.preset)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RANGE_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">{custom ? rangeLabel(range) : "Custom"}</SelectItem>
            </SelectContent>
          </Select>
          {custom && (
            // The dropdown can't reopen the calendar for the same choice. TODO(client): copy.
            <Button variant="secondary" size="sm" className="sm:hidden" onClick={() => pick("custom")}>
              <CalendarIcon />
              Change dates
            </Button>
          )}

          {/* Wider screens: a segmented control. */}
          <ToggleGroup
            type="single"
            value={range.preset}
            onValueChange={pick}
            aria-label="Date range"
            className="hidden gap-1 rounded-field bg-warm-100 p-1 ring-1 ring-warm-200 ring-inset sm:flex"
          >
            {RANGE_PRESETS.map((p) => (
              <ToggleGroupItem key={p.value} value={p.value} className={segment}>
                {p.label}
              </ToggleGroupItem>
            ))}
            {/* Clicking Custom again reopens the calendar. */}
            <ToggleGroupItem value="custom" className={segment} onClick={() => custom && pick("custom")}>
              <CalendarIcon aria-hidden className="size-3.5" />
              {custom ? rangeLabel(range) : "Custom"}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </PopoverAnchor>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={draft}
          onSelect={setDraft}
          numberOfMonths={wide ? 2 : 1}
          defaultMonth={draft?.from ?? toDate(today)}
          endMonth={toDate(today)}
          disabled={{ after: toDate(today) }}
          max={MAX_RANGE_DAYS}
        />
        <div className="flex items-center justify-between gap-3 border-t border-warm-200 px-3 py-2.5">
          {/* TODO(client): copy. */}
          <p className="type-ui-caption text-text-tertiary">
            {draft?.from ? rangeLabel({ ...range, preset: "custom", from: toDay(draft.from), to: toDay(draft.to ?? draft.from) }) : "Pick a start and end date"}
          </p>
          <Button size="sm" onClick={apply} disabled={!draft?.from}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const segment =
  "h-8 gap-1.5 rounded-[calc(var(--radius-field)-4px)] px-3 type-ui-label text-text-tertiary hover:bg-white/60 hover:text-text-primary data-[state=on]:bg-white data-[state=on]:text-text-primary data-[state=on]:shadow-control";
