"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";

type SplitHeadingProps = {
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  children: ReactNode;
  /** Seconds before the first line starts. */
  delay?: number;
};

// Headline that rises into view line by line from behind a mask as it scrolls
// in (once). Re-splits automatically when fonts load or the width changes, so
// line breaks always match what's on screen. Without JS (or with reduced
// motion) it's just the heading.
export function SplitHeading({ as = "h2", className, children, delay = 0 }: SplitHeadingProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = ref.current;
        if (!el) return;
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.09,
              delay,
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            }),
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
