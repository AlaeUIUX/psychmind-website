"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const baseStats = [
  { value: "2,400+", label: "verified professionals" },
  { value: "2,400+", label: "verified professionals" },
  { value: "< 24h", label: "avg. time to first session" },
  { value: "4.8", label: "average provider rating", icon: true },
  { value: "100%", label: "confidential & private" },
];

const DESKTOP_VISIBLE_COUNT = 3;
const MOBILE_VISIBLE_COUNT = 2;
const MOBILE_BREAKPOINT = "(min-width: 640px)";
const AUTO_ADVANCE_MS = 3000;
const TRANSITION_MS = 600;
const RESUME_AFTER_TOUCH_MS = 5000;

export function Stats() {
  const [order, setOrder] = useState(() => baseStats.map((_, i) => i));
  const [offset, setOffset] = useState(0); // 0 = resting, 1 = mid-shift-by-one-card
  const [instant, setInstant] = useState(false);
  const [visibleCount, setVisibleCount] = useState(DESKTOP_VISIBLE_COUNT);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 3 cards side by side reads as cramped on narrow phones — show 2 there.
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT);
    const update = () => setVisibleCount(mql.matches ? DESKTOP_VISIBLE_COUNT : MOBILE_VISIBLE_COUNT);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = setInterval(() => {
      if (!pausedRef.current) setOffset(1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, []);

  // Once the slide-by-one-card animation finishes, snap invisibly back to
  // offset 0 while rotating the first card to the end — since the content is
  // now identical to what was on screen, the snap is imperceptible, and the
  // shuffle can repeat indefinitely instead of ever resetting to the start.
  const handleTransitionEnd = useCallback(() => {
    setOffset((current) => {
      if (current !== 1) return current;
      setInstant(true);
      setOrder((prev) => [...prev.slice(1), prev[0]]);
      return 0;
    });
  }, []);

  useEffect(() => {
    if (!instant) return;
    const raf = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(raf);
  }, [instant]);

  const pause = () => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };
  const resume = () => {
    pausedRef.current = false;
  };
  const pauseThenResumeAfterDelay = () => {
    pause();
    resumeTimeoutRef.current = setTimeout(resume, RESUME_AFTER_TOUCH_MS);
  };

  return (
    <div className="w-full border-y border-warm-300 bg-warm-200 px-6 sm:px-12 md:px-16 py-3">
      <div
        className="overflow-hidden rounded-3xl bg-warm-100"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pauseThenResumeAfterDelay}
      >
        <div
          onTransitionEnd={handleTransitionEnd}
          className="flex"
          style={{
            width: `${(baseStats.length / visibleCount) * 100}%`,
            transform: `translateX(-${offset * (100 / baseStats.length)}%)`,
            transition: instant ? "none" : `transform ${TRANSITION_MS}ms ease-in-out`,
          }}
        >
          {order.map((idx) => {
            const stat = baseStats[idx];
            return (
              <div
                key={idx}
                style={{ width: `${100 / baseStats.length}%` }}
                className="shrink-0 flex flex-col items-center gap-4 py-6 sm:py-10"
              >
                <div className="flex flex-col items-center gap-3 w-full">
                  <p className="font-display text-warm-950 text-display-sm tracking-[-0.6px] text-center flex items-center justify-center gap-1">
                    {stat.value}
                    {stat.icon && (
                      <img src="/images/home/star-icon.svg" alt="" width={19} height={19} />
                    )}
                  </p>
                  <p className="text-warm-700 text-md font-medium text-center">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
