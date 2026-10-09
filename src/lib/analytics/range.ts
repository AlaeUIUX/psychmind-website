// Date ranges for the analytics dashboards. A day is a calendar day in New
// York time (the US business day), written YYYY-MM-DD, so "today" on a
// dashboard matches the day providers are living in, not UTC's.

export const ANALYTICS_TZ = "America/New_York";

/** Figma D1's time filter. */
export const RANGE_PRESETS = [
  { value: "7d", days: 7, label: "Last 7 days" },
  { value: "30d", days: 30, label: "Last 30 days" },
  { value: "90d", days: 90, label: "Last 3 months" },
] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number]["value"];

/** Longest custom range (a year, with a leap day). */
export const MAX_RANGE_DAYS = 366;

export type DayRange = {
  preset: RangePreset | "custom";
  from: string;
  to: string;
  days: number;
  /** The same number of days just before, for "vs previous period". */
  prevFrom: string;
  prevTo: string;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The analytics day an instant falls on. */
export function dayOf(at: Date | number = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: ANALYTICS_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Days from `from` to `to`, both included. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
}

export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

/** A real calendar date (2026-02-30 isn't). */
export function isDay(value: unknown): value is string {
  return typeof value === "string" && DAY.test(value) && addDays(value, 0) === value;
}

function build(preset: DayRange["preset"], from: string, to: string): DayRange {
  const days = daysBetween(from, to);
  return { preset, from, to, days, prevFrom: addDays(from, -days), prevTo: addDays(from, -1) };
}

type Param = string | string[] | undefined;
const first = (v: Param) => (Array.isArray(v) ? v[0] : v);

/** Reads ?range=30d, or ?from=…&to=… for a custom range. Anything invalid
 *  (reversed, in the future, too long) falls back to the last 7 days. */
export function parseRange(params: { range?: Param; from?: Param; to?: Param }, today = dayOf()): DayRange {
  const from = first(params.from);
  const to = first(params.to);
  if (isDay(from) && isDay(to) && from <= to && to <= today && daysBetween(from, to) <= MAX_RANGE_DAYS) {
    return build("custom", from, to);
  }
  const preset = RANGE_PRESETS.find((p) => p.value === first(params.range)) ?? RANGE_PRESETS[0];
  return build(preset.value, addDays(today, -(preset.days - 1)), today);
}

/** The query string for a range ("" for the default). */
export function rangeQuery(range: { preset: DayRange["preset"]; from?: string; to?: string }): string {
  if (range.preset === "custom") return `?from=${range.from}&to=${range.to}`;
  return range.preset === RANGE_PRESETS[0].value ? "" : `?range=${range.preset}`;
}

const shortDate = (day: string, year = false) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: year ? "numeric" : undefined, timeZone: "UTC" });

/** "Last 30 days", or "Sep 1 – Sep 14, 2026" for a custom range. */
export function rangeLabel(range: DayRange): string {
  const preset = RANGE_PRESETS.find((p) => p.value === range.preset);
  if (preset) return preset.label;
  if (range.from === range.to) return shortDate(range.from, true);
  return `${shortDate(range.from)} – ${shortDate(range.to, true)}`;
}

/** "Oct 9" (or "Thu, Oct 9" with the weekday) for an analytics day. */
export function dayLabel(day: string, weekday = false): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: weekday ? "short" : undefined, month: "short", day: "numeric", timeZone: "UTC" });
}
