"use client";

import { cn } from "cn";
import { useRef, type ReactNode } from "react";
import { DoodleArrow, DoodleHookArrow } from "@/components/ui/doodles";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// Handwritten sticky notes pinned around the sample profile, each pointing a
// pencil arrow at the part of the profile it explains. They live in the page
// margins, so they only appear where there's room for them (≥1480px).

function Note({ children, tape, className }: { children: ReactNode; tape: string; className?: string }) {
  return (
    <div
      data-note
      className={cn(
        "paper-bg relative w-[160px] rounded-[6px] px-4 pt-5 pb-4 font-display text-[16px] leading-5 text-warm-800 italic shadow-card ring-1 ring-black/[0.04]",
        className,
      )}
    >
      <span aria-hidden className={cn("absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2", tape)} />
      {children}
    </div>
  );
}

export function ProfileNotes({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (min-width: 1480px)`, () => {
        const q = gsap.utils.selector(root);
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 65%", once: true } });
        q<HTMLElement>("[data-pin]").forEach((pin, i) => {
          tl.from(pin.querySelector("[data-note]"), { autoAlpha: 0, scale: 1.15, y: -10, duration: 0.5, ease: "back.out(1.8)" }, i * 0.35);
          tl.from(pin.querySelectorAll("[data-draw]"), { drawSVG: 0, duration: 0.6, ease: "power2.inOut", stagger: 0.1 }, i * 0.35 + 0.3);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative">
      {children}

      <div aria-hidden className="pointer-events-none absolute inset-0 z-20 hidden text-warm-600 min-[1480px]:block">
        {/* → the Verified badge */}
        <div data-pin className="absolute -top-14 left-[44%] flex items-start gap-1">
          <Note tape="bg-tape-rose/90 rotate-[3deg]" className="-rotate-[3deg]">
            Credentials checked by hand
          </Note>
          <DoodleHookArrow className="mt-10 h-24 w-12 -scale-x-100" />
        </div>
        {/* → session prices in the sidebar */}
        <div data-pin className="absolute top-[250px] -right-[196px] flex items-center gap-1">
          <DoodleArrow className="w-12 -scale-x-100" />
          <Note tape="bg-tape-lilac/90 -rotate-[4deg]" className="rotate-[4deg]">
            Fees shown upfront, before you ask
          </Note>
        </div>
        {/* → "Who I work with" */}
        <div data-pin className="absolute top-[330px] -left-[204px] flex items-center gap-1">
          <Note tape="bg-review-mint -rotate-[2deg]" className="-rotate-[2deg]">
            Read their approach first
          </Note>
          <DoodleArrow className="w-12" />
        </div>
      </div>
    </div>
  );
}
