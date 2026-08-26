"use client";

import { animate } from "animejs";
import { useRef, useState } from "react";
import { reviews } from "./reviews-data";

const EASE = "inCubic";

// Mobile-only: this card (and the flow around it) doesn't exist in the desktop
// design (node 108:376) — it's specific to the mobile layout (node 276:774).
export function TestimonialCard() {
  const [index, setIndex] = useState(0);
  const count = reviews.length;
  const current = reviews[index];
  const cardRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  function goTo(direction: 1 | -1) {
    if (busy.current || !cardRef.current) return;
    busy.current = true;
    const el = cardRef.current;

    animate(el, {
      translateX: direction * -28,
      opacity: 0,
      duration: 180,
      ease: EASE,
    }).then(() => {
      setIndex((i) => (i + direction + count) % count);
      el.style.transform = `translateX(${direction * 28}px)`;
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        animate(el, {
          translateX: 0,
          opacity: 1,
          duration: 260,
          ease: EASE,
        }).then(() => {
          busy.current = false;
        });
      });
    });
  }

  return (
    <section className="md:hidden w-full flex flex-col items-center gap-10 px-4 py-10">
      <div
        ref={cardRef}
        className="relative w-full max-w-[346px] -rotate-[1.4deg] rounded-[14px] border border-black/20 shadow-[0px_12px_17px_0px_rgba(0,0,0,0.25)] p-3 transition-colors duration-300"
        style={{ background: current.bg }}
      >
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-black/10 pl-1 pr-2 py-1 text-xs font-medium">
            <img src="/images/home/reviews-badge-icon.svg" alt="" width={14} height={14} />
            <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
              Reviews
            </span>
          </span>
          <p className="font-display text-lg text-[#1c1c1c] tracking-[-0.2px]">&ldquo;{current.quote}&rdquo;</p>
          <p className="font-display text-sm text-warm-600">{current.author}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          aria-label="Previous review"
          onClick={() => goTo(-1)}
          className="flex size-11 items-center justify-center rounded-md border border-warm-300"
        >
          <img src="/images/home/nav-arrow-icon.svg" alt="" width={18} height={18} className="rotate-180" />
        </button>
        <button
          aria-label="Next review"
          onClick={() => goTo(1)}
          className="flex size-11 items-center justify-center rounded-md border border-warm-300"
        >
          <img src="/images/home/nav-arrow-icon.svg" alt="" width={18} height={18} />
        </button>
      </div>
    </section>
  );
}
