"use client";

import { animate } from "animejs";
import { useEffect, useRef, type PointerEvent } from "react";
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

const EASE = "inCubic";
const DURATION = 480;

function applyRole(el: HTMLDivElement, role: RoleStyle, animated: boolean) {
  return animate(el, {
    translateX: role.x,
    translateY: role.y,
    translateZ: role.z,
    rotate: `${role.rotate}deg`,
    scale: role.scale,
    duration: animated ? DURATION : 0,
    ease: EASE,
  });
}

// Desktop-only counterpart to <TestimonialCard /> (which is mobile-only). Each
// card element permanently owns one review; only its role (front / back1 /
// back2) rotates. Dragging the front card past a threshold sends it under
// the stack (z-index drops immediately, animates further back than the
// resting back-of-stack spot) while the other two advance forward one slot.
export function DesktopTestimonials() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const order = useRef<number[]>(reviews.map((_, i) => i));
  const phase = useRef<"idle" | "dragging" | "animating">("idle");
  const dragStartX = useRef(0);
  const dragEl = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    order.current.forEach((reviewIndex, role) => {
      const el = cardRefs.current[reviewIndex];
      if (!el) return;
      el.style.zIndex = String(ROLE_STYLE[role].zIndex);
      applyRole(el, ROLE_STYLE[role], false);
    });
  }, []);

  function advance(direction: 1 | -1) {
    phase.current = "animating";
    const current = order.current;
    const outgoingReviewIndex = current[0];
    const outgoingEl = cardRefs.current[outgoingReviewIndex];

    const nextOrder =
      direction === 1
        ? [current[1], current[2], current[0]]
        : [current[2], current[0], current[1]];

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
      advance(1);
    } else if (dragX >= threshold) {
      advance(-1);
    } else {
      phase.current = "animating";
      applyRole(el, ROLE_STYLE[0], true).then(() => {
        phase.current = "idle";
      });
    }
  }

  return (
    <section className="hidden md:flex w-full flex-col items-center gap-10 px-12 lg:px-20 py-16">
      <div className="relative w-full max-w-[947px] h-[520px] [perspective:1400px]">
        {reviews.map((review, i) => (
          <div
            key={review.author}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 rounded-[20px] cursor-grab select-none touch-none active:cursor-grabbing will-change-transform"
            style={{ background: review.bg }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-6 px-10 lg:px-24 py-16 text-center">
              <span className="inline-flex items-center gap-2.5 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-4 py-2 text-lg font-medium">
                <img src="/images/home/reviews-badge-icon.svg" alt="" width={28} height={28} />
                <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
                  Reviews
                </span>
              </span>
              <p className="max-w-[620px] font-display text-[32px] text-[#1c1c1c] tracking-[-0.4px] leading-[1.35]">
                &ldquo;{review.quote}&rdquo;
              </p>
              <p className="font-display text-xl text-warm-600">{review.author}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
