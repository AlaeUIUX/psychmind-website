"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// A hairline along the top of the viewport that fills as you read the
// article body (the element with `data-article-body`).
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo(
        bar.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: "[data-article-body]", start: "top 70%", end: "bottom 70%", scrub: 0.3 },
        },
      );
    });
    return () => mm.revert();
  });

  return (
    <div
      ref={bar}
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left scale-x-0 bg-brand-primary motion-reduce:hidden"
    />
  );
}
