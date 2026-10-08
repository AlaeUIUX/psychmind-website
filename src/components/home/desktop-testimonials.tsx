"use client";

import { animate, cubicBezier } from "animejs";
import { cn } from "cn";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Reveal } from "@/components/reveal";
import { ReviewBlock } from "@/components/shared/review-block";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/section";
import { reviews } from "./reviews-data";

type RoleStyle = {
  x: number;
  y: number;
  z: number;
  rotate: number;
  scale: number;
  zIndex: number;
};

// Resting transform for each position in the stack: front, then two cards
// peeking out behind it (shifted up, rotated apart, pushed back in Z so the
// container's perspective makes them read as further away).
const ROLE_STYLE: RoleStyle[] = [
  { x: 0, y: 0, z: 0, rotate: 0, scale: 1, zIndex: 30 },
  { x: 10, y: -16, z: -60, rotate: 2, scale: 0.96, zIndex: 20 },
  { x: -14, y: -28, z: -120, rotate: -2.6, scale: 0.92, zIndex: 10 },
];

// Where the outgoing front card dips to before settling into the back slot —
// exaggerated past ROLE_STYLE[2] so it visibly tucks under the other two
// instead of just sliding sideways off the stack.
const EXIT_UNDER: RoleStyle = { x: -20, y: 46, z: -180, rotate: -4, scale: 0.86, zIndex: 5 };

// Same curve as --ease-out-soft in globals.css.
const EASE = cubicBezier(0.22, 1, 0.36, 1);
const DURATION = 560;
const AUTO_MS = 6500;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyRole(el: HTMLDivElement, role: RoleStyle, animated: boolean) {
  return animate(el, {
    translateX: role.x,
    translateY: role.y,
    translateZ: role.z,
    rotate: `${role.rotate}deg`,
    scale: role.scale,
    duration: animated && !reducedMotion() ? DURATION : 0,
    ease: EASE,
  });
}

// Desktop-only counterpart to <TestimonialCard /> (which is mobile-only). Each
// card element permanently owns one review; only its role (front / back1 /
// back2) rotates. Drag the front card past a threshold — or use the arrow
// buttons / dots — to send it under the stack while the other two advance.
export function DesktopTestimonials() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const order = useRef<number[]>(reviews.map((_, i) => i));
  const phase = useRef<"idle" | "dragging" | "animating">("idle");
  const dragStartX = useRef(0);
  const dragEl = useRef<HTMLDivElement | null>(null);
  const [front, setFront] = useState(0);

  useEffect(() => {
    order.current.forEach((reviewIndex, role) => {
      const el = cardRefs.current[reviewIndex];
      if (!el) return;
      el.style.zIndex = String(ROLE_STYLE[role].zIndex);
      applyRole(el, ROLE_STYLE[role], false);
    });
  }, []);

  // Gently shuffles to the next review on its own while the stack is on
  // screen; hovering (or reading) it holds the current card.
  const stageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || hovered || reducedMotion()) return;
    const t = setInterval(() => {
      if (phase.current === "idle") advance(1);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [inView, hovered]);

  function advance(direction: 1 | -1) {
    if (phase.current === "animating") return;
    phase.current = "animating";
    const current = order.current;
    const outgoingReviewIndex = current[0];
    const outgoingEl = cardRefs.current[outgoingReviewIndex];

    const nextOrder =
      direction === 1
        ? [current[1], current[2], current[0]]
        : [current[2], current[0], current[1]];
    setFront(nextOrder[0]);

    const animations = nextOrder.map((reviewIndex, role) => {
      const el = cardRefs.current[reviewIndex];
      if (!el) return Promise.resolve();
      if (reviewIndex === outgoingReviewIndex) return Promise.resolve();
      el.style.zIndex = String(ROLE_STYLE[role].zIndex);
      return applyRole(el, ROLE_STYLE[role], true).then();
    });

    if (outgoingEl) {
      outgoingEl.style.zIndex = String(EXIT_UNDER.zIndex);
      animations.push(applyRole(outgoingEl, EXIT_UNDER, true).then());
    }

    Promise.all(animations).then(() => {
      order.current = nextOrder;
      if (outgoingEl) {
        outgoingEl.style.zIndex = String(ROLE_STYLE[2].zIndex);
        applyRole(outgoingEl, ROLE_STYLE[2], false);
      }
      phase.current = "idle";
    });
  }

  function goTo(reviewIndex: number) {
    const position = order.current.indexOf(reviewIndex);
    if (position === 1) advance(1);
    else if (position === 2) advance(-1);
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (phase.current !== "idle") return;
    const el = cardRefs.current[order.current[0]];
    if (!el) return;
    phase.current = "dragging";
    dragEl.current = el;
    dragStartX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (phase.current !== "dragging" || !dragEl.current) return;
    const dragX = e.clientX - dragStartX.current;
    dragEl.current.style.transform = `translateX(${dragX}px) translateZ(24px) rotate(${dragX / 22}deg)`;
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (phase.current !== "dragging" || !dragEl.current) return;
    const dragX = e.clientX - dragStartX.current;
    const el = dragEl.current;
    dragEl.current = null;
    const threshold = 110;

    if (dragX <= -threshold) {
      phase.current = "idle";
      advance(1);
    } else if (dragX >= threshold) {
      phase.current = "idle";
      advance(-1);
    } else {
      phase.current = "animating";
      applyRole(el, ROLE_STYLE[0], true).then(() => {
        phase.current = "idle";
      });
    }
  }

  return (
    <Section className="hidden md:block">
      <Container className="max-w-[947px]">
        <Reveal>
          <div
            ref={stageRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            role="region"
            aria-roledescription="carousel"
            aria-label="Reviews"
            className="relative h-[420px] [perspective:1400px] lg:h-[460px]"
          >
            {reviews.map((review, i) => (
              <div
                key={review.author}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                aria-hidden={i !== front}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={cn(
                  "absolute inset-0 flex cursor-grab touch-none select-none items-center justify-center rounded-card px-10 py-16 shadow-card will-change-transform active:cursor-grabbing lg:px-24",
                  review.bg,
                )}
              >
                <ReviewBlock quote={review.quote} author={review.author} />
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-5">
            <Button variant="secondary" size="icon" aria-label="Previous review" onClick={() => advance(-1)}>
              <ArrowRightIcon className="rotate-180" />
            </Button>
            <div className="flex items-center gap-2">
              {reviews.map((review, i) => (
                <button
                  key={review.author}
                  type="button"
                  aria-label={`Show review ${i + 1} of ${reviews.length}`}
                  aria-current={i === front}
                  onClick={() => goTo(i)}
                  className="group flex h-6 items-center px-1"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-500 ease-out-soft",
                      i === front ? "w-6 bg-warm-900" : "w-1.5 bg-warm-300 group-hover:bg-warm-600",
                    )}
                  />
                </button>
              ))}
            </div>
            <Button variant="secondary" size="icon" aria-label="Next review" onClick={() => advance(1)}>
              <ArrowRightIcon />
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
