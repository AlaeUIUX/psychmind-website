"use client";

import { animate, cubicBezier } from "animejs";
import { cn } from "cn";
import { useRef, useState } from "react";
import { Reveal } from "@/components/reveal";
import { ReviewBlock } from "@/components/shared/review-block";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Section } from "@/components/ui/section";
import { reviews } from "./reviews-data";

// Same curve as --ease-out-soft in globals.css.
const EASE = cubicBezier(0.22, 1, 0.36, 1);

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIndex((i) => (i + direction + count) % count);
      return;
    }
    busy.current = true;
    const el = cardRef.current;

    animate(el, {
      translateX: direction * -28,
      opacity: 0,
      duration: 200,
      ease: "inQuad",
    }).then(() => {
      setIndex((i) => (i + direction + count) % count);
      el.style.transform = `translateX(${direction * 28}px)`;
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        animate(el, {
          translateX: 0,
          opacity: 1,
          duration: 420,
          ease: EASE,
        }).then(() => {
          busy.current = false;
        });
      });
    });
  }

  return (
    <Section spacing="sm" className="md:hidden">
      <Reveal className="flex flex-col items-center gap-8">
        <div className="w-full max-w-[360px] -rotate-[1.4deg]">
          <div
            ref={cardRef}
            aria-live="polite"
            className={cn(
              "rounded-card border border-black/10 px-6 py-9 shadow-raised transition-colors duration-500",
              current.bg,
            )}
          >
            <ReviewBlock quote={current.quote} author={current.author} size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="secondary" size="icon" aria-label="Previous review" onClick={() => goTo(-1)}>
            <ArrowRightIcon className="rotate-180" />
          </Button>
          <div className="flex items-center gap-2" aria-hidden>
            {reviews.map((review, i) => (
              <span
                key={review.author}
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-500 ease-out-soft",
                  i === index ? "w-6 bg-warm-900" : "w-1.5 bg-warm-300",
                )}
              />
            ))}
          </div>
          <Button variant="secondary" size="icon" aria-label="Next review" onClick={() => goTo(1)}>
            <ArrowRightIcon />
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}
