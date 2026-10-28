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
//
// The landing page's letter is the default; the mission page writes its own (its note in
// paragraphs, its closing line, and the team's line and links under the signatures).
// The mission's is `prewritten`: the note is there from the start and nothing pins (a
// pinned, scrubbed letter could come back half-written after going back to the page);
// only the closing line and the signatures write themselves, once, as they come into
// view, in their own time rather than the scroll's.

const NOTE =
  "We started PsychMind because people spent too long looking for help and not finding it, not because the help wasn't there, but because the path to it was confusing, cold, and sometimes just discouraging. We're two people who believe that finding a provider should feel as safe as the therapy itself.";
const LINE = "PsychMind is our attempt to close that gap.";
const LINE_NARROW = ["PsychMind is our attempt", "to close that gap."];
/** A letter: its note (paragraphs), its closing line (as set from sm up, and below),
 *  what goes under the signatures, and whether the note is already written (see above). */
export type Letter = {
  note: string[];
  line: { wide: string[]; narrow: string[] };
  signedBy?: ReactNode;
  prewritten?: boolean;
};
const LANDING: Letter = { note: [NOTE], line: { wide: [LINE], narrow: LINE_NARROW } };
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

/** The closing line, a line of the letter's serif per entry, written out: from sm up
 *  (`wide`) or below. */
function Hand({ lines, wide }: { lines: string[]; wide: boolean }) {
  const first = wide ? 0.9 : 0.95;
  return (
    <svg
      data-hand={wide ? "wide" : "narrow"}
      aria-hidden
      className={
        wide
          ? "mt-5 hidden w-full overflow-visible font-[family-name:var(--font-letter)] text-[24px] text-warm-900 sm:block"
          : "mt-4 block w-full overflow-visible font-[family-name:var(--font-letter)] text-[20px] text-warm-900 sm:hidden"
      }
      style={{ height: `${0.25 + lines.length * 1.3}em` }}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={wide ? 0.45 : 0.4}
      strokeOpacity={0}
      strokeLinejoin="round"
    >
      {lines.map((l, i) => (
        <text key={i} x="0" y={`${first + i * 1.3}em`}>
          <Pen text={l} />
        </text>
      ))}
    </svg>
  );
}

/** The letter (the landing page's unless `letter` is given), and over it `badge` (the
 *  section's eyebrow), which is pinned with it. */
export function FoundersLetter({ badge, letter = LANDING }: { badge?: ReactNode; letter?: Letter }) {
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

        if (letter.prewritten) {
          // the note's already there: the closing line and the signatures write themselves
          // once, a few seconds' worth, as the line comes into view (or straight away when
          // the page opens already past it)
          gsap.set([...hand, ...signPens], { strokeDashoffset: DASH, fillOpacity: 0, strokeOpacity: 1 });
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: q(`[data-hand="${wide ? "wide" : "narrow"}"]`)[0], start: "top 85%", once: true },
          });
          tl.to(hand, { strokeDashoffset: 0, duration: 0.45, stagger: 0.03 });
          tl.to(hand, { fillOpacity: 1, strokeOpacity: 0, duration: 0.3, stagger: 0.03 }, "<0.3");
          signs.forEach((s, i) => {
            const pens = s.querySelectorAll("[data-pen]");
            tl.to(pens, { strokeDashoffset: 0, duration: 0.45, stagger: 0.09 }, i ? ">-0.1" : "+=0.15");
            tl.to(pens, { fillOpacity: 1, strokeOpacity: 0, duration: 0.3, stagger: 0.09 }, "<0.3");
          });
          return;
        }

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
          <div className="flex flex-col gap-4 sm:gap-5">
            {letter.note.map((para, k) => (
              <p key={k} className="font-[family-name:var(--font-letter)] text-base leading-[26px] text-warm-800 sm:text-lg sm:leading-[30px]">
                {letter.prewritten
                  ? para
                  : para.split(" ").map((w, i) => (
                      <span key={i}>
                        <span data-word>{w}</span>{" "}
                      </span>
                    ))}
              </p>
            ))}
          </div>

          {/* the closing line, in the same serif, a step larger, written out */}
          <p className="sr-only">{letter.line.wide.join(" ")}</p>
          <Hand lines={letter.line.wide} wide />
          <Hand lines={letter.line.narrow} wide={false} />

          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-warm-200 pt-6 sm:mt-8 sm:pt-8">
            {SIGNERS.map((s) => (
              <div key={s.name} className="flex flex-col">
                <Signature name={s.name} />
                <p className="mt-2 text-[13px] leading-5 font-medium text-warm-900">{s.name}</p>
                <p className="text-[13px] leading-5 text-warm-500">{s.role}</p>
              </div>
            ))}
          </div>
          {letter.signedBy && <div className="mt-6 border-t border-warm-200 pt-6 sm:mt-8 sm:pt-8">{letter.signedBy}</div>}
        </article>
      </div>
    </div>
  );
}
