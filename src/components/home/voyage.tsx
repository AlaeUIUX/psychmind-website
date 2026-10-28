"use client";

import { useRef } from "react";
import type { createVoyageBoat } from "./globe-scene/voyage-boat";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// The stretch of sea between the reviews and the letter: a few pencil doodles
// (an island, a rock, waves) and the girl's boat sailing one big S down the page
// as you scroll: the privacy globe's boat, in 3D and in its dot print, at its size
// (globe-scene/voyage-boat.js), on a small canvas moved along the S. She always
// faces the way the S goes, swinging round on her keel through its bends, and
// rocks a little as she goes. The scroll is eased, so a flick of the wheel sets her
// sailing rather than jumping her ahead. She arrives just over "Meet the
// creators", and the whole stretch fades as the founders' letter locks in.
// Scrolling back up rewinds her. Decorative only. Reduced motion shows her arrived.

type Route = {
  viewBox: string;
  d: string;
  /** Doodles along the way, each a path (drawn in as the route comes into view). */
  marks: string[];
};

const ROUTES: Record<"wide" | "narrow", Route> = {
  wide: {
    viewBox: "0 0 1000 440",
    d: "M500 8C860 8 860 220 500 220C140 220 140 432 500 432",
    marks: [
      // the island on the right, with its palm
      "M872 132C886 116 914 114 930 132",
      "M901 124C899 108 902 96 910 86",
      "M910 86C902 82 892 84 886 90M910 86C918 80 928 82 934 88M910 86C912 78 908 72 902 70",
      // the rock on the left
      "M74 312C80 296 98 292 108 306C112 300 120 302 124 312",
      // wave marks
      "M300 70C306 64 312 64 318 70C324 76 330 76 336 70",
      "M690 300C696 294 702 294 708 300C714 306 720 306 726 300",
      "M344 352C350 346 356 346 362 352C368 358 374 358 380 352",
    ],
  },
  narrow: {
    viewBox: "0 0 360 440",
    d: "M180 6C340 6 340 219 180 219C20 219 20 432 180 432",
    marks: [
      // the island on the right, with its palm
      "M300 160C310 150 328 148 340 160",
      "M320 154C318 142 320 134 326 128",
      "M326 128C320 124 312 126 308 130M326 128C332 124 340 126 344 130M326 128C328 122 324 118 320 116",
      // the rock on the left
      "M30 312C34 300 48 298 54 308C58 304 64 306 66 312",
      // wave marks
      "M60 70C64 66 68 66 72 70C76 74 80 74 84 70",
      "M282 380C286 376 290 376 294 380C298 384 302 384 306 380",
    ],
  },
};

function RouteSvg({
  kind,
  className,
}: {
  kind: keyof typeof ROUTES;
  className: string;
}) {
  const r = ROUTES[kind];
  return (
    <svg
      data-route={kind}
      viewBox={r.viewBox}
      aria-hidden
      focusable={false}
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      overflow="visible"
    >
      {/* her route: not drawn, only sailed */}
      <path data-path d={r.d} stroke="none" />
      {r.marks.map((m) => (
        <path
          key={m}
          data-mark
          d={m}
          className="stroke-warm-400"
          strokeWidth={1.4}
        />
      ))}
    </svg>
  );
}

type Boat = ReturnType<typeof createVoyageBoat>;

export function Voyage() {
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_OK, wide: "(min-width: 48rem)" }, (ctx) => {
        const { motion, wide } = ctx.conditions as {
          motion: boolean;
          wide: boolean;
        };
        const el = root.current;
        const canvas = canvasRef.current;
        const svg = el?.querySelector<SVGSVGElement>(
          `[data-route="${wide ? "wide" : "narrow"}"]`,
        );
        if (!el || !canvas || !svg) return;
        const path = svg.querySelector<SVGPathElement>("[data-path]")!;
        const letter = document.querySelector<HTMLElement>("[data-voyage-end]");
        const len = path.getTotalLength();

        // The 3D boat, fetched once the stretch is near (three.js isn't in the page's
        // own bundle), then run only while it's on screen.
        let boat: Boat | null = null;
        let disposed = false;

        // She sails; the scroll only says where she's bound. The scroll sets a mark on
        // the S (target); she makes for it at a boat's pace: she picks up speed slowly,
        // never goes faster than SPEED, slows into the bends ahead of her (no faster
        // than she can turn at TURN), and eases to a stop at the mark. Scroll fast and
        // she falls behind and sails on after; scroll back up and she sails back.
        const SPEED = 110; // px a second, cruising (up to FAST when she's well behind her mark)
        const FAST = 240;
        const ACCEL = 70; // px a second², speeding up
        const BRAKE = 110; // px a second², slowing down
        const TURN = 1.2; // radians a second she can turn at, at most
        const target = { p: motion ? 0 : 1 };
        let s = target.p * len; // where she is, in the route's units
        let v = 0; // her speed, px a second (always ≥ 0; dir says which way)
        let dir = 1;

        // the S's bends: how sharply it turns at each step along it (radians a unit)
        const STEP = 4;
        const bends: number[] = [];
        {
          let prev: number | null = null;
          for (let d = 0; d <= len; d += STEP) {
            const a = path.getPointAtLength(Math.max(0, d - 2));
            const b = path.getPointAtLength(Math.min(len, d + 2));
            const th = Math.atan2(b.y - a.y, b.x - a.x);
            let bend = 0;
            if (prev !== null)
              bend =
                Math.abs(Math.atan2(Math.sin(th - prev), Math.cos(th - prev))) /
                STEP;
            bends.push(bend);
            prev = th;
          }
        }
        const scaleNow = () =>
          svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;

        // Where she is: on the S at s, facing the way it goes (its direction on the page
        // as her heading: right, toward you down the page, left).
        const place = () => {
          const at = path.getPointAtLength(s);
          const a = path.getPointAtLength(Math.max(0, s - 4));
          const b = path.getPointAtLength(Math.min(len, s + 4));
          if (!boat) return;
          const box = svg.getBoundingClientRect();
          const home = el.getBoundingClientRect();
          const scale = box.width / svg.viewBox.baseVal.width;
          const { x, y } = boat.anchor;
          canvas.style.transform = `translate(${box.left - home.left + at.x * scale - x}px, ${box.top - home.top + at.y * scale - y}px)`;
          // sailing back up the S she still faces the way she goes
          const heading =
            dir > 0
              ? Math.atan2(b.x - a.x, b.y - a.y)
              : Math.atan2(a.x - b.x, a.y - b.y);
          boat.steer(heading, v);
        };

        const sail = (dt: number) => {
          const scale = scaleNow();
          const goal = target.p * len;
          const gap = goal - s;
          if (Math.abs(gap) < 0.05 && v < 1) {
            v = 0;
            return;
          }
          const want = Math.sign(gap) || dir;
          // turning round means stopping first
          if (want !== dir && v > 0) {
            v = Math.max(0, v - BRAKE * dt);
          } else {
            dir = want;
            // the fastest she may go now: SPEED, slow enough to stop at the mark, and slow
            // enough for every bend coming up (given how hard she can brake before it)
            const gapPx = Math.abs(gap) * scale;
            let limit = Math.min(
              SPEED + Math.min(FAST - SPEED, gapPx * 0.35),
              Math.sqrt(2 * BRAKE * gapPx),
            );
            const i0 = Math.round(s / STEP);
            for (let j = 0; j < 60; j++) {
              const i = i0 + dir * j;
              if (i < 0 || i >= bends.length) break;
              const bendPx = bends[i] / scale; // radians per px
              const turnMax = bendPx > 1e-5 ? TURN / bendPx : Infinity;
              limit = Math.min(
                limit,
                Math.sqrt(turnMax * turnMax + 2 * BRAKE * j * STEP * scale),
              );
            }
            v =
              v < limit
                ? Math.min(limit, v + ACCEL * dt)
                : Math.max(limit, v - BRAKE * dt);
          }
          const move = (v * dt) / scale;
          s = dir > 0 ? Math.min(len, s + move) : Math.max(0, s - move);
          if (
            (dir > 0 && s > goal && want > 0) ||
            (dir < 0 && s < goal && want < 0)
          )
            s = goal;
        };
        const tick = (_: number, ms: number) => {
          sail(Math.min(ms / 1000, 0.1));
          place();
        };

        const near = new IntersectionObserver(
          async ([e]) => {
            if (!e.isIntersecting || boat) return;
            near.disconnect();
            const { createVoyageBoat } =
              await import("./globe-scene/voyage-boat");
            if (disposed) return;
            boat = createVoyageBoat(canvas);
            place();
            if (!motion) boat.still();
            else watch.observe(el);
            canvas.style.opacity = "1";
          },
          { rootMargin: "50% 0px" },
        );
        const watch = new IntersectionObserver(([e]) =>
          e.isIntersecting ? boat?.start() : boat?.stop(),
        );
        near.observe(el);
        const onResize = () => {
          boat?.resize();
          place();
        };
        window.addEventListener("resize", onResize);

        if (motion) {
          // the doodles along the way draw in as the route comes up
          gsap.from(svg.querySelectorAll("[data-mark]"), {
            drawSVG: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.inOut",
            scrollTrigger: { trigger: el, start: "top 80%", once: true },
          });
          // and her mark moves down the S as the stretch of sea passes up the screen,
          // reaching "Meet the creators" before the letter comes up to the middle; she
          // sails after it (sail, on every frame)
          gsap.ticker.add(tick);
          gsap.to(target, {
            p: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              endTrigger: letter ?? el,
              end: letter ? "top 72%" : "bottom 40%",
              scrub: true,
            },
          });
          // then the whole stretch fades as the letter locks in (it pins at its middle)
          if (letter) {
            gsap.fromTo(
              el,
              { autoAlpha: 1 },
              {
                autoAlpha: 0,
                ease: "none",
                immediateRender: false,
                scrollTrigger: {
                  trigger: letter,
                  start: "top 64%",
                  end: "top 54%",
                  scrub: true,
                },
              },
            );
          }
        }
        place();
        return () => {
          disposed = true;
          gsap.ticker.remove(tick);
          near.disconnect();
          watch.disconnect();
          window.removeEventListener("resize", onResize);
          boat?.dispose();
          boat = null;
          canvas.style.opacity = "0";
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden
      className="relative w-full px-4 sm:px-8 lg:px-12"
    >
      <RouteSvg
        kind="wide"
        className="mx-auto hidden h-auto w-full max-w-[1000px] md:block"
      />
      <RouteSvg
        kind="narrow"
        className="mx-auto block h-auto w-full max-w-[360px] md:hidden"
      />
      {/* the boat, in 3D, moved along the route */}
      {/* pixelated: the dots are drawn one per device pixel, and the smooth scroll lands the
          canvas between pixels, so letting the browser blend it would soften and sharpen the
          dots frame by frame (a flicker); drawn pixel for pixel they stay crisp and just move */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute top-0 left-0 h-[110px] w-[150px] [image-rendering:pixelated] opacity-0 transition-opacity duration-500"
      />
    </div>
  );
}
