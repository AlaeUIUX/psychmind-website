"use client";

import { useRef } from "react";
import { DoodleHookArrow } from "@/components/ui/doodles";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// The founders' doodle with handwritten name tags: Brenda on the left,
// Dee (curly hair) on the right. Tags and pencil arrows draw in on scroll.
export function CreatorsIllustration() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 75%", once: true } });
        q<HTMLElement>("[data-tag]").forEach((tag, i) => {
          tl.from(tag.querySelectorAll("[data-draw]"), { drawSVG: 0, duration: 0.6, ease: "power2.inOut" }, 0.3 + i * 0.4);
          tl.from(tag.querySelector("[data-name]"), { autoAlpha: 0, y: 6, duration: 0.4 }, 0.55 + i * 0.4);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative mt-6 w-fit sm:mt-8">
      {/* Figma applies no object-fit override here (defaults to stretch-to-fill on
          the square source), so the illustration is intentionally non-uniformly
          scaled to its 436:347 box rather than letterboxed or cropped. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/home/mission-illustration.png"
        alt="Brenda and Dee, the founders of PsychMind"
        className="h-[143px] w-[180px] animate-float sm:h-[227px] sm:w-[286px]"
      />

      {/* Brenda — above her bun, arrow down to her */}
      <span data-tag className="pointer-events-none absolute -top-7 left-[2%] flex items-start gap-0.5 text-warm-700 sm:-top-8">
        <span data-name className="font-display text-[17px] italic sm:text-xl">
          Brenda
        </span>
        <DoodleHookArrow className="mt-3 h-9 w-5 sm:h-11 sm:w-6" />
      </span>

      {/* Dee — just right of her curly bun, arrow curling down onto it */}
      <span data-tag className="pointer-events-none absolute -top-5 left-[76%] flex items-start gap-0.5 text-warm-700 sm:-top-6">
        <DoodleHookArrow className="mt-3 h-9 w-5 -scale-x-100 sm:h-11 sm:w-6" />
        <span data-name className="font-display text-[17px] italic sm:text-xl">
          Dee
        </span>
      </span>
    </div>
  );
}
