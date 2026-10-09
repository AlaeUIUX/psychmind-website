"use client";

import { useEffect, useState } from "react";

// A date in the viewer's own time zone. The server doesn't know it, so the
// first paint shows the UTC date (stable, so hydration matches) and the
// browser swaps in local time right after.

type Style = "date" | "datetime";

const options: Record<Style, Intl.DateTimeFormatOptions> = {
  date: { month: "short", day: "numeric", year: "numeric" },
  datetime: { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
};

export function LocalTime({ value, style = "date", className }: { value: Date | string; style?: Style; className?: string }) {
  const ms = new Date(value).getTime();
  const [text, setText] = useState(() => new Intl.DateTimeFormat("en-US", { ...options[style], timeZone: "UTC" }).format(ms));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the local time zone only exists in the browser
    setText(new Intl.DateTimeFormat("en-US", options[style]).format(ms));
  }, [ms, style]);
  return (
    <time dateTime={new Date(ms).toISOString()} className={className}>
      {text}
    </time>
  );
}
