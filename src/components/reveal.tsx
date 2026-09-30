"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

type RevealTag = "div" | "section" | "header" | "ul" | "ol" | "li" | "article" | "p" | "span";

type RevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: RevealTag;
  /**
   * `scroll` (default) — fades + lifts in once it scrolls into view.
   * `load` — plays immediately on first paint; use for above-the-fold heroes
   * so they never wait on hydration.
   */
  trigger?: "scroll" | "load";
  /** Animate each direct child in sequence instead of the element as a whole. */
  stagger?: boolean;
  /** Extra delay before the (first) item animates, in ms. */
  delay?: number;
  id?: string;
};

// The motion itself lives in globals.css ("Reveal motion"); this component
// only flags elements and, for scroll reveals, sets `data-revealed` the first
// time they enter the viewport. It animates once and stays put — sections
// don't fade back out when you scroll past them.
export function Reveal({
  children,
  className,
  style,
  as = "div",
  trigger = "scroll",
  stagger = false,
  delay = 0,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || trigger === "load") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.setAttribute("data-revealed", "");
        observer.disconnect();
      },
      // threshold 0 so even very tall elements trigger; the negative bottom
      // margin waits until the element is a little way into the viewport.
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger]);

  const flags =
    trigger === "load"
      ? { "data-reveal-load": "" }
      : stagger
        ? { "data-reveal-stagger": "" }
        : { "data-reveal": "" };

  const Tag = as as ElementType;

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms`, ...style } as CSSProperties) : style}
      {...flags}
    >
      {children}
    </Tag>
  );
}
