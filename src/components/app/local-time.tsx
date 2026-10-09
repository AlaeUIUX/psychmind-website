"use client";

import { useEffect, useState } from "react";

// A date in the viewer's own time zone. The server doesn't know it, so the
// first paint shows the UTC date (stable, so hydration matches) and the
// browser swaps in local time right after.

type Style = "date" | "datetime" | "day";

const options: Record<Style, Intl.DateTimeFormatOptions> = {
  date: { month: "short", day: "numeric", year: "numeric" },
  datetime: { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  day: { month: "short", day: "numeric" },
};

const ORDINAL: Record<string, string> = { one: "st", two: "nd", few: "rd", other: "th" };

/** "Today", "Yesterday", or "Apr 6th" (Figma D1's recent requests). */
function relativeDay(ms: number, timeZone?: string) {
  const dayKey = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(t);
  const now = Date.now();
  if (dayKey(ms) === dayKey(now)) return "Today";
  if (dayKey(ms) === dayKey(now - 86_400_000)) return "Yesterday";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" }).formatToParts(ms);
  const month = parts.find((p) => p.type === "month")?.value;
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return `${month} ${day}${ORDINAL[new Intl.PluralRules("en-US", { type: "ordinal" }).select(day)]}`;
}

function format(ms: number, style: Style, timeZone?: string) {
  if (style === "day") return relativeDay(ms, timeZone);
  return new Intl.DateTimeFormat("en-US", { ...options[style], timeZone }).format(ms);
}

export function LocalTime({ value, style = "date", className }: { value: Date | string; style?: Style; className?: string }) {
  const ms = new Date(value).getTime();
  // The relative style waits for the browser: "Today" depends on the clock too.
  const [text, setText] = useState(() => new Intl.DateTimeFormat("en-US", { ...options[style], timeZone: "UTC" }).format(ms));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the local time zone only exists in the browser
    setText(format(ms, style));
  }, [ms, style]);
  return (
    <time dateTime={new Date(ms).toISOString()} className={className}>
      {text}
    </time>
  );
}
