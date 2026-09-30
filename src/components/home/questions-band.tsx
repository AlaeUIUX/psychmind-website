"use client";

import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import { DoodleSparkle, DoodleUnderline } from "@/components/ui/doodles";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";

// "Where do I start?" — the visitor's own questions, voiced back to them.
// The band pins while you scroll. Each question surfaces word by word like a
// passing thought while a pencil trail, with a small light at its tip, draws
// itself from one question to the next. The trail ends at a red globe; when
// the light reaches it the globe blinks, and that flash switches the answer on.
// Draft copy — TODO(client): approve wording.
const questions = [
  { text: "Where do I even start?", pos: "top-[20%] sm:top-[13%] left-[5%] sm:left-[6%]", size: "text-[28px] sm:text-[50px] lg:text-[60px]" },
  { text: "Who can I actually trust?", pos: "top-[31%] sm:top-[26%] right-[5%] text-right sm:right-[7%]", size: "text-[26px] sm:text-[42px] lg:text-[52px]" },
  { text: "Will they understand me?", pos: "top-[42%] sm:top-[40%] left-[8%] sm:left-[16%]", size: "text-[28px] sm:text-[50px] lg:text-[60px]" },
  { text: "What will this cost?", pos: "top-[53%] right-[6%] text-right sm:right-[14%]", size: "text-[25px] sm:text-[38px] lg:text-[46px]" },
  { text: "How long will I wait?", pos: "top-[64%] sm:top-[66%] left-[5%] sm:left-[22%]", size: "text-[26px] sm:text-[42px] lg:text-[52px]" },
];

const sparkles = [
  "top-[9%] right-[22%] size-5",
  "top-[50%] left-[3%] size-4 max-sm:hidden",
  "bottom-[8%] right-[9%] size-6",
  "top-[35%] left-[46%] size-3 max-sm:hidden",
];

type Pt = { x: number; y: number };

// Smooth curve through every point (Catmull-Rom → cubic Bézier segments).
function curveSegments(pts: Pt[]) {
  const segs: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    segs.push(`C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`);
  }
  return segs;
}

export function QuestionsBand() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  // Bumps when the frame is resized, so the trail is re-plotted around the
  // questions' new positions.
  const [layout, setLayout] = useState(0);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      clearTimeout(t);
      t = setTimeout(() => setLayout((n) => n + 1), 250);
    });
    ro.observe(el);
    document.fonts?.ready.then(() => setLayout((n) => n + 1));
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const box = frame.current!.getBoundingClientRect();
        const W = box.width;
        const H = box.height;
        const items = q<HTMLElement>("[data-q]");
        const svg = q<SVGSVGElement>("[data-trail-svg]")[0];
        const trail = q<SVGPathElement>("[data-trail]")[0];
        const comet = q<SVGPathElement>("[data-comet]")[0];
        const dot = q<SVGGElement>("[data-dot]")[0];
        const orb = q<HTMLElement>("[data-orb]")[0];
        const ring = q<HTMLElement>("[data-ring]")[0];
        const flash = q<HTMLElement>("[data-flash]")[0];

        // --- Plot the trail: an underline beneath each question, swept from
        // one to the next, ending at the globe below the last one.
        const pts: Pt[] = [];
        const anchors: number[] = []; // index of each question's first point
        items.forEach((el) => {
          const r = el.getBoundingClientRect();
          const left = r.left - box.left;
          const right = r.right - box.left;
          const y = r.bottom - box.top + (W < 640 ? 8 : 14);
          const inset = Math.min(r.width * 0.08, 40);
          anchors.push(pts.length);
          const rightAligned = el.classList.contains("text-right");
          // travel along the underline in reading order, towards the next question
          if (rightAligned) pts.push({ x: right - inset, y }, { x: left + inset, y: y + 4 });
          else pts.push({ x: left + inset, y: y + 4 }, { x: right - inset, y });
        });
        const orbPt = { x: W / 2, y: H * (W < 640 ? 0.86 : 0.87) };
        pts.push(orbPt);

        const segs = curveSegments(pts);
        const d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}${segs.join("")}`;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        trail.setAttribute("d", d);
        comet.setAttribute("d", d);
        const total = trail.getTotalLength();

        // Length along the trail at each plotted point.
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
        svg.appendChild(probe);
        const lengthAt = (i: number) => {
          if (i <= 0) return 0;
          probe.setAttribute("d", `M${pts[0].x} ${pts[0].y}${segs.slice(0, i).join("")}`);
          return probe.getTotalLength();
        };
        const frac = pts.map((_, i) => lengthAt(i) / total);
        probe.remove();

        const COMET = Math.min(90, total * 0.06);
        trail.style.strokeDasharray = `${total}`;
        comet.style.strokeDasharray = `${COMET} ${total}`;
        gsap.set(orb, { left: orbPt.x, top: orbPt.y, xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
        gsap.set(ring, { left: orbPt.x, top: orbPt.y, xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });
        gsap.set(flash, { autoAlpha: 0, background: `radial-gradient(circle at ${orbPt.x}px ${orbPt.y}px, rgba(255,214,226,0.55), rgba(192,16,72,0.18) 35%, transparent 70%)` });

        const state = { p: 0 };
        const render = () => {
          const len = state.p * total;
          trail.style.strokeDashoffset = `${total - len}`;
          comet.style.strokeDashoffset = `${COMET - len}`;
          const pt = trail.getPointAtLength(Math.max(0.01, len));
          dot.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
          dot.style.opacity = state.p > 0.002 && state.p < 0.999 ? "1" : "0";
          comet.style.opacity = state.p > 0.002 && state.p < 0.999 ? "1" : "0";
        };
        render();

        // --- The dark sheet opens out to full bleed as it arrives.
        gsap.fromTo(
          q("[data-sheet]"),
          { clipPath: "inset(7% 3.5% 0% 3.5% round 40px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: true },
          },
        );

        const splits = items.map((el) => SplitText.create(el, { type: "words" }));
        gsap.set(items, { autoAlpha: 0 });
        gsap.set(q("[data-answer] > *"), { autoAlpha: 0, y: 30 });

        // One continuous tween drives the trail from the first question to the
        // globe, so it never stalls while you scroll. Each question is timed to
        // surface just as the light reaches it, and its words light up at the
        // same pace the trail underlines them.
        const D = 7; // trail length in timeline units
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
        });

        tl.to(state, { p: 1, duration: D, ease: "none", onUpdate: render }, 0);
        tl.from(q("[data-eyebrow]"), { autoAlpha: 0, y: 24, duration: 0.4, ease: "power2.out" }, 0);
        tl.from(q("[data-sparkle] [data-draw]"), { drawSVG: 0, stagger: 0.3, duration: 0.8 }, 0.4);

        splits.forEach((split, i) => {
          const a = anchors[i];
          const start = frac[a] * D;
          const end = frac[a + 1] * D;
          const appear = Math.max(0, start - 0.12);
          const words = split.words.length;
          const wordDur = 0.3;
          tl.set(items[i], { autoAlpha: 1 }, appear);
          tl.fromTo(
            split.words,
            { opacity: 0.08, yPercent: 30 },
            {
              opacity: 1,
              yPercent: 0,
              duration: wordDur,
              stagger: Math.max(0.02, (end - start - wordDur) / Math.max(1, words - 1)),
            },
            appear,
          );
          if (i > 0) tl.to(items[i - 1], { opacity: 0.3, filter: "blur(0.6px)", duration: 0.4 }, start);
        });

        // The globe glows up out of the background as the light heads for it…
        tl.to(orb, { autoAlpha: 0.85, scale: 1, duration: 0.8, ease: "power2.out" }, D - 0.9);

        // …and blinks when it arrives, switching the answer on.
        tl.addLabel("activate", D);
        tl.to(orb, { scale: 1.5, duration: 0.08, ease: "power2.out" }, "activate");
        tl.to(orb, { scale: 1, duration: 0.14, ease: "power2.in" }, "activate+=0.08");
        tl.fromTo(ring, { autoAlpha: 0.6, scale: 0.6 }, { autoAlpha: 0, scale: 14, duration: 0.6, ease: "power2.out", immediateRender: false }, "activate");
        tl.to(flash, { autoAlpha: 1, duration: 0.07 }, "activate");
        tl.to(flash, { autoAlpha: 0, duration: 0.5 }, "activate+=0.07");
        tl.to([...items, trail, comet], { opacity: 0, filter: "blur(6px)", duration: 0.45, stagger: 0.02 }, "activate+=0.05");
        tl.to(q("[data-eyebrow]"), { autoAlpha: 0, duration: 0.3 }, "activate");
        // the globe drifts up and dissolves into the glow behind the answer
        tl.to(orb, { y: H * 0.5 - orbPt.y, scale: 7, autoAlpha: 0.28, filter: "blur(28px)", duration: 0.7, ease: "power2.inOut" }, "activate+=0.2");
        // the answer flickers on, like a light catching
        tl.to(q("[data-answer] > *"), {
          keyframes: [
            { autoAlpha: 1, y: 0, duration: 0.06 },
            { autoAlpha: 0.25, duration: 0.05 },
            { autoAlpha: 1, duration: 0.09 },
          ],
          stagger: 0.12,
        }, "activate+=0.12");
        tl.from(q("[data-answer] [data-underline] [data-draw]"), { drawSVG: 0, duration: 0.5 }, "activate+=0.45");
        tl.to({}, { duration: 0.6 });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [layout], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      aria-labelledby="questions-answer"
      className="relative motion-safe:h-[420vh] motion-safe:sm:h-[440vh]"
    >
      <div ref={frame} data-header-dark className="motion-safe:sticky motion-safe:top-0 motion-safe:h-svh">
        <div data-sheet className="grain relative h-full overflow-hidden bg-warm-950 text-warm-25 motion-reduce:py-24">
          {/* soft crimson glow, low and off-centre */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-1/3 left-1/2 h-[80%] w-[90%] -translate-x-1/2 rounded-full bg-brand-primary/20 blur-[120px]"
          />

          {/* The trail, its travelling light, and the globe it leads to. */}
          <svg data-trail-svg aria-hidden className="pointer-events-none absolute inset-0 size-full motion-reduce:hidden" preserveAspectRatio="none">
            <defs>
              <filter id="trail-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path data-trail fill="none" stroke="rgb(215 211 208 / 0.4)" strokeWidth="1.4" strokeLinecap="round" />
            <path data-comet fill="none" stroke="#ffd6e2" strokeWidth="2.2" strokeLinecap="round" filter="url(#trail-glow)" style={{ opacity: 0 }} />
            <g data-dot style={{ opacity: 0 }}>
              <circle r="9" fill="rgb(192 16 72 / 0.35)" filter="url(#trail-glow)" />
              <circle r="3.2" fill="#fff" />
            </g>
          </svg>
          <span
            data-ring
            aria-hidden
            className="pointer-events-none absolute size-16 rounded-full border border-[#ff9ab8]/35 opacity-0 blur-[1px] motion-reduce:hidden"
          />
          {/* The globe: a soft, blended glow rather than a solid ball. */}
          <span
            data-orb
            aria-hidden
            className="pointer-events-none absolute size-24 rounded-full opacity-0 mix-blend-screen blur-[3px] motion-reduce:hidden sm:size-28"
            style={{
              background:
                "radial-gradient(circle, rgb(255 222 232 / 0.85) 0%, rgb(236 72 120 / 0.55) 24%, rgb(192 16 72 / 0.28) 48%, rgb(192 16 72 / 0.08) 64%, transparent 72%)",
            }}
          />
          <div data-flash aria-hidden className="pointer-events-none absolute inset-0 opacity-0 motion-reduce:hidden" />

          <p
            data-eyebrow
            className="relative z-10 pt-24 text-center type-small tracking-[0.08em] text-warm-300 uppercase motion-safe:absolute motion-safe:inset-x-0 motion-safe:top-[5%] motion-safe:pt-16 sm:motion-safe:pt-20"
          >
            Before you reach out, you might be wondering
          </p>

          <ul className="relative mx-auto h-full max-w-[1240px] motion-reduce:flex motion-reduce:flex-col motion-reduce:gap-6 motion-reduce:px-6 motion-reduce:pt-10">
            {questions.map((item) => (
              <li
                key={item.text}
                data-q
                className={cn(
                  "font-display leading-[1.05] tracking-[-0.02em] text-balance motion-safe:absolute motion-safe:max-w-[90%]",
                  item.pos,
                  item.size,
                )}
              >
                {item.text}
              </li>
            ))}
          </ul>

          {sparkles.map((pos) => (
            <span key={pos} data-sparkle aria-hidden className={cn("absolute text-warm-300/50 motion-reduce:hidden", pos)}>
              <DoodleSparkle className="size-full" />
            </span>
          ))}

          <div
            data-answer
            className="flex flex-col items-center gap-6 px-6 text-center motion-safe:absolute motion-safe:inset-0 motion-safe:justify-center motion-reduce:pt-16"
          >
            <h2 id="questions-answer" className="max-w-[900px] font-display text-[40px] leading-[1.05] tracking-[-0.025em] text-balance sm:text-[64px] lg:text-[80px]">
              You deserve answers{" "}
              <span className="relative inline-block italic">
                before you reach out.
                <span data-underline className="absolute -bottom-2 left-0 h-3 w-full text-brand-primary sm:-bottom-3 sm:h-4">
                  <DoodleUnderline className="size-full" />
                </span>
              </span>
            </h2>
            <p className="max-w-[520px] type-lead text-warm-300">
              Verified credentials, clear prices and real availability — upfront, on every profile.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
