"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { CreatorsIllustration } from "./creators-illustration";

// The founders' note as a letter, after Interfere's (interfere.com/about): a
// light container on the bento's grey with the founders' doodle standing on
// its top edge, the note in a book serif, a hairline, then the two signatures
// over their names.
//
// It writes itself as you scroll. When the section's badge, the doodle and the
// letter reach the middle of the screen they hold there together (pinned), and
// scrolling on brings the note's words in one at a time, then writes the
// closing line in the same serif, a step larger, each letter's outline drawn
// and then inked, and last the two signatures sign, letter by letter, the same
// way. Then the page moves on. Where they don't all fit on the screen at once
// (short screens), nothing pins: the same writing plays as they scroll by.
// Reduced motion (and no script) shows the letter written.
//
// The closing line and the signatures are SVG text, one tspan per letter, so a
// stroke dash can draw each glyph's outline in turn (then it fades as the ink
// fills, and at rest there's no outline, only the fill); the line is set on one
// line from sm up and on two below. For now the signatures are the names in the
// closing line's serif, each starting where its name below does. TODO(client):
// the founders' own signatures (requested from Davona) and the roles under the
// names.

const NOTE =
  "We started PsychMind because people spent too long looking for help and not finding it, not because the help wasn't there, but because the path to it was confusing, cold, and sometimes just discouraging. We're two people who believe that finding a provider should feel as safe as the therapy itself.";
const LINE = "PsychMind is our attempt to close that gap.";
const LINE_NARROW = ["PsychMind is our attempt", "to close that gap."];
const SIGNERS = [
  { name: "Brenda", role: "Co-founder, PsychMind" },
  { name: "Dee", role: "Co-founder, PsychMind" },
];

/** Longer than any letter's outline in the closing line, so a dash this long hides it whole. */
const DASH = 260;
/** The sticky header's height: the pinned letter centres in the screen below it. */
const HEADER = 72;

function Pen({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <tspan key={i} data-pen style={{ strokeDasharray: DASH }}>
          {ch}
        </tspan>
      ))}
    </>
  );
}

/** A founder's signature, for now her name in the closing line's serif and size,
 *  written as the line is. */
function Signature({ name }: { name: string }) {
  return (
    <svg
      data-sign
      aria-hidden
      className="block h-8 w-full overflow-visible font-[family-name:var(--font-letter)] text-[20px] text-warm-900 sm:h-9 sm:text-[24px]"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={0.45}
      strokeOpacity={0}
      strokeLinejoin="round"
    >
      <text x="0" y="0.9em">
        <Pen text={name} />
      </text>
    </svg>
  );
}

/** The letter, and over it `badge` (the section's eyebrow), which is pinned with it. */
export function FoundersLetter({ badge }: { badge?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_OK, wide: "(min-width: 40rem)" }, (ctx) => {
        const { motion, wide } = ctx.conditions as { motion: boolean; wide: boolean };
        if (!motion || !group.current) return;
        const q = gsap.utils.selector(root);
        const words = q("[data-word]");
        const hand = q(`[data-hand="${wide ? "wide" : "narrow"}"] [data-pen]`);
        const signs = q<SVGElement>("[data-sign]");
        const signPens = q("[data-sign] [data-pen]");

        // the words wait in the faint grey (read off the page: the greys are runtime variables)
        const ink = getComputedStyle(words[0]).color;
        const probe = document.createElement("span");
        probe.className = "text-warm-300";
        root.current!.appendChild(probe);
        const faint = getComputedStyle(probe).color;
        probe.remove();
        gsap.set(words, { color: faint });
        gsap.set([...hand, ...signPens], { strokeDashoffset: DASH, fillOpacity: 0, strokeOpacity: 1 });

        // pinned only when the badge, the doodle and the letter fit on the screen together
        const el = group.current;
        const pinned = el.offsetHeight <= window.innerHeight - HEADER - 24;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: pinned
            ? {
                trigger: el,
                start: () => `center ${Math.round((window.innerHeight + HEADER) / 2)}px`,
                // about two screens of scroll to write it all
                end: () => `+=${Math.round(window.innerHeight * 2)}`,
                pin: true,
                scrub: 0.6,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              }
            : { trigger: el, start: "top 75%", end: "bottom 45%", scrub: 0.6 },
        });
        // the note, a word at a time
        tl.to(words, { color: ink, duration: 0.3, stagger: 0.1 });
        // the closing line: each letter's outline, then its ink
        tl.to(hand, { strokeDashoffset: 0, duration: 0.5, stagger: 0.06 }, "+=0.3");
        // inked, the outline goes, so the line settles at the note's regular weight
        tl.to(hand, { fillOpacity: 1, strokeOpacity: 0, duration: 0.3, stagger: 0.06 }, "<0.3");
        // the two signatures, one after the other, a letter at a time, as the line was
        signs.forEach((s, i) => {
          const pens = s.querySelectorAll("[data-pen]");
          tl.to(pens, { strokeDashoffset: 0, duration: 0.5, stagger: 0.12 }, i ? ">-0.1" : "+=0.2");
          tl.to(pens, { fillOpacity: 1, strokeOpacity: 0, duration: 0.3, stagger: 0.12 }, "<0.3");
        });
        if (pinned) tl.to({}, { duration: 0.6 }); // a beat to read it, signed, before the page moves on
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="w-full">
      <div ref={group} className="mx-auto flex w-full max-w-[720px] flex-col items-center">
        {badge && <div className="mb-10 sm:mb-12">{badge}</div>}
        <CreatorsIllustration />
        {/* data-voyage-end: the boat's stretch of sea above (voyage.tsx) fades as this locks in */}
        <article data-voyage-end className="w-full rounded-card border border-warm-200 bg-warm-100 px-6 py-8 sm:px-16 sm:py-12">
          <p className="font-[family-name:var(--font-letter)] text-base leading-[26px] text-warm-800 sm:text-lg sm:leading-[30px]">
            {NOTE.split(" ").map((w, i) => (
              <span key={i}>
                <span data-word>{w}</span>{" "}
              </span>
            ))}
          </p>

          {/* the closing line, in the same serif, a step larger, written out */}
          <p className="sr-only">{LINE}</p>
          <svg
            data-hand="wide"
            aria-hidden
            className="mt-5 hidden h-9 w-full overflow-visible font-[family-name:var(--font-letter)] text-[24px] text-warm-900 sm:block"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={0.45}
            strokeOpacity={0}
            strokeLinejoin="round"
          >
            <text x="0" y="0.9em">
              <Pen text={LINE} />
            </text>
          </svg>
          <svg
            data-hand="narrow"
            aria-hidden
            className="mt-4 block h-[58px] w-full overflow-visible font-[family-name:var(--font-letter)] text-[20px] text-warm-900 sm:hidden"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={0.4}
            strokeOpacity={0}
            strokeLinejoin="round"
          >
            <text x="0" y="0.95em">
              <Pen text={LINE_NARROW[0]} />
            </text>
            <text x="0" y="2.25em">
              <Pen text={LINE_NARROW[1]} />
            </text>
          </svg>

          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-warm-200 pt-6 sm:mt-8 sm:pt-8">
            {SIGNERS.map((s) => (
              <div key={s.name} className="flex flex-col">
                <Signature name={s.name} />
                <p className="mt-2 text-[13px] leading-5 font-medium text-warm-900">{s.name}</p>
                <p className="text-[13px] leading-5 text-warm-500">{s.role}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
