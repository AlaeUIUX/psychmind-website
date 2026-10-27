"use client";

import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { statusChip as chip, statusPill as pill } from "@/components/ui/section-badge";

// The platform figures above the hero headline, as one pill that morphs from
// one figure to the next: the old content rolls up and out, the next rolls
// in from below, and the pill's width glides to fit it. It pauses while
// hovered. With reduced motion the figures sit side by side, still.
// TODO(client): confirm the figures.
type Item = { chip: ReactNode; label: string; text: string };

// eslint-disable-next-line @next/next/no-img-element
const star = <img src="/images/home/star-icon.svg" alt="" className="size-3" />;

const items: Item[] = [
  { chip: "< 24h", label: "avg. time to first session", text: "Under 24 hours average time to first session" },
  { chip: <>4.8 {star}</>, label: "average provider rating", text: "4.8 average provider rating" },
  {
    chip: (
      <>
        <span className="status-bead mr-1" aria-hidden />
        Confidential
      </>
    ),
    label: "your search is never shared",
    text: "Confidential: your search is never shared",
  },
];

/** How long each figure stays before the next rolls in. */
const HOLD = 3200;

// The status pill (pill, chip: ui/section-badge.tsx), sized to sit under the
// search: never larger than the bar's own text (12px labels, 14px values), so
// 13px, a 32px pill with the figure in a 24px inner chip. Section eyebrows
// (SectionBadge) are the same pill, so they read as these figures do.

function Content({ item }: { item: Item }) {
  return (
    <>
      <span className={chip}>{item.chip}</span>
      <span>{item.label}</span>
    </>
  );
}

const REDUCE = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCE).matches,
    () => false,
  );
}

function MorphPill() {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number>();
  const [paused, setPaused] = useState(false);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  // The pill's width follows the shown figure (plus its 1px borders);
  // re-measured when fonts land.
  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[index];
      if (el) setWidth(el.offsetWidth + 2);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [index]);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % items.length), HOLD);
    return () => window.clearTimeout(id);
  }, [index, paused]);

  const prev = (index - 1 + items.length) % items.length;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(pill, "relative overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]")}
      style={{ width }}
      aria-hidden
    >
      {items.map((item, i) => (
        <span
          key={item.label}
          ref={(el) => void (refs.current[i] = el)}
          className={cn(
            "flex h-full w-max items-center gap-2 pr-3 pl-1 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            i === index ? "relative translate-y-0 opacity-100" : "absolute top-0 left-0 opacity-0",
            i !== index && (i === prev ? "-translate-y-full" : "translate-y-full"),
          )}
        >
          <Content item={item} />
        </span>
      ))}
    </div>
  );
}

export function TrustRow() {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {/* Read out as a plain list; the moving pill itself is decorative. */}
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.label}>{item.text}</li>
        ))}
      </ul>
      {reduce ? (
        items.map((item) => (
          <div key={item.label} aria-hidden className={cn(pill, "flex items-center gap-2 pr-3 pl-1")}>
            <Content item={item} />
          </div>
        ))
      ) : (
        <MorphPill />
      )}
    </div>
  );
}
