"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { reviews } from "./reviews-data";

type Phase = "idle" | "dragging" | "exiting";

// Desktop-only counterpart to <TestimonialCard /> (which is mobile-only). The
// two color layers behind the front card are real upcoming reviews (not just
// decoration) — dragging the front card past a threshold flings it off and
// promotes the next color/quote into place, like fanning a stacked deck.
export function DesktopTestimonials() {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const startX = useRef(0);
  const count = reviews.length;

  const current = reviews[index];
  const next = reviews[(index + 1) % count];
  const after = reviews[(index + 2) % count];

  function advance(direction: 1 | -1) {
    setPhase("exiting");
    setDragX(direction * -1400);
    window.setTimeout(() => {
      setIndex((i) => (i + direction + count) % count);
      setPhase("idle");
      setDragX(0);
    }, 320);
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (phase !== "idle") return;
    setPhase("dragging");
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (phase !== "dragging") return;
    setDragX(e.clientX - startX.current);
  }

  function handlePointerUp() {
    if (phase !== "dragging") return;
    const threshold = 110;
    if (dragX <= -threshold) {
      advance(1);
    } else if (dragX >= threshold) {
      advance(-1);
    } else {
      setPhase("idle");
      setDragX(0);
    }
  }

  const rotate = dragX / 22;
  const tiltY = dragX / 26;

  return (
    <section className="hidden md:flex w-full flex-col items-center gap-10 px-12 lg:px-20 py-16">
      <div className="relative w-full max-w-[947px] [perspective:1400px]">
        <div
          className="absolute -top-4 -left-3 right-3 bottom-4 rounded-[20px] -rotate-1 transition-colors duration-300"
          style={{ background: after.bg }}
          aria-hidden
        />
        <div
          className="absolute -top-2 -right-2 left-2 bottom-2 rounded-[20px] rotate-1 transition-colors duration-300"
          style={{ background: next.bg }}
          aria-hidden
        />

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative rounded-[20px] overflow-hidden cursor-grab select-none touch-none active:cursor-grabbing"
          style={{
            background: current.bg,
            transform: `translateX(${dragX}px) rotate(${rotate}deg) rotateY(${tiltY}deg)`,
            transition:
              phase === "dragging"
                ? "none"
                : "transform 0.32s cubic-bezier(.22,.8,.32,1), opacity 0.28s ease, background 0.3s",
            opacity: phase === "exiting" ? 0 : 1,
          }}
        >
          <div
            className="absolute left-0 bottom-0 w-[220px] lg:w-[300px] pointer-events-none"
            style={{ aspectRatio: current.leftRatio }}
          >
            <Image src={current.leftDoodle} alt="" fill className="object-contain object-bottom" draggable={false} />
          </div>
          <div
            className="absolute right-0 bottom-0 w-[180px] lg:w-[250px] pointer-events-none"
            style={{ aspectRatio: current.rightRatio }}
          >
            <Image src={current.rightDoodle} alt="" fill className="object-contain object-bottom" draggable={false} />
          </div>

          <div className="relative flex flex-col items-center gap-6 px-[220px] lg:px-[300px] py-16 text-center">
            <span className="inline-flex items-center gap-2.5 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-4 py-2 text-lg font-medium">
              <img src="/images/home/reviews-badge-icon.svg" alt="" width={28} height={28} />
              <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
                Reviews
              </span>
            </span>
            <p className="font-display text-[32px] text-[#1c1c1c] tracking-[-0.4px] leading-[1.35]">
              &ldquo;{current.quote}&rdquo;
            </p>
            <p className="font-display text-xl text-warm-600">{current.author}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
