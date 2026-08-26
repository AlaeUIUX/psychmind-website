"use client";

import { animate } from "animejs";
import { useEffect, useRef, type ReactNode } from "react";

const OFFSET = 28;
const IN_DURATION = 650;
const OUT_DURATION = 450;
const EASE = "outQuad";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Fraction of the element that must be visible to trigger the reveal. */
  threshold?: number;
};

// Fades + lifts a section in once it crosses into view, and reverses the
// same animation if it leaves the viewport in either direction — so
// scrolling back up makes already-seen sections settle back out instead of
// snapping away. Each instance owns one IntersectionObserver; a handful of
// these per page is negligible.
export function Reveal({ children, className, threshold = 0.15 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible.current) {
          visible.current = true;
          animate(el, { opacity: 1, translateY: 0, duration: IN_DURATION, ease: EASE });
        } else if (!entry.isIntersecting && visible.current) {
          visible.current = false;
          animate(el, { opacity: 0, translateY: OFFSET, duration: OUT_DURATION, ease: EASE });
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0, transform: `translateY(${OFFSET}px)` }}>
      {children}
    </div>
  );
}
