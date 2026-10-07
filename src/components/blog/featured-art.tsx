"use client";

import { useRef } from "react";
import { DoodleMagnifier } from "@/components/ui/doodles";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// The featured card's magnifying glass. It draws itself in like a pen sketch
// when the card scrolls into view, the glass fills, then a glint sweeps
// across the lens. Hovering the card tilts it like it's being picked up.
export function FeaturedArt() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 85%", once: true } });
        tl.from(q("[data-draw]"), { drawSVG: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.08 })
          .from(q("[data-glass]"), { opacity: 0, scale: 0.85, svgOrigin: "130 78", duration: 0.6 }, "-=0.5")
          .from(q("[data-glint]"), { drawSVG: "0% 0%", duration: 0.5, ease: "power2.out" }, "-=0.2");
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden className="relative size-[180px] shrink-0 sm:size-[220px] md:size-[260px]">
      <div className="absolute inset-[12%] rounded-full bg-white/80 blur-2xl" />
      <div className="relative size-full animate-float">
        <DoodleMagnifier className="size-full text-warm-800 transition-[rotate,scale] duration-700 ease-out-soft group-hover:scale-[1.04] group-hover:-rotate-6" />
      </div>
    </div>
  );
}
