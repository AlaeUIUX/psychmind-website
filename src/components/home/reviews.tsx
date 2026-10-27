"use client";

import { cn } from "cn";
import { useEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type KeyboardEvent } from "react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { PauseIcon, PlayIcon } from "@/components/ui/hugeicons";
import { Container, Section } from "@/components/ui/section";
import { SectionBadge } from "@/components/ui/section-badge";
import { letterSerif } from "./letter-serif";
import { reviews } from "./reviews-data";

// "Reviews": one voice at a time. The quote is set large in the founders'
// letter's serif and writes itself in as it comes into view, word by word from
// the faint grey to ink, as the letter's note does, but on its own clock rather
// than the scroll, so it doesn't pin just before the letter does. Under it each
// reviewer is a tab whose line fills while their quote is up, and then the next
// one writes itself in. Hovering or focusing it holds the quote, and so does the
// pause button (auto-advancing content must be stoppable: WCAG 2.2.2). Reduced
// motion (and no script) shows each quote written, and only the tabs change it.

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const WORD_MS = 45; // between one word inking and the next

/** The quote, one span a word, inking in turn: `phase` says whether it waits faint
 *  ("waiting"), writes ("writing"), or is simply set ("static", before the script runs). */
function Inked({ text, phase }: { text: string; phase: "static" | "waiting" | "writing" }) {
  const words = `“${text}”`.split(" ");
  return words.map((w, i) => (
    <span key={i}>
      <span
        className={phase === "static" ? undefined : "animate-ink-in motion-reduce:animate-none"}
        style={phase === "static" ? undefined : { animationDelay: `${i * WORD_MS}ms`, animationPlayState: phase === "writing" ? "running" : "paused" }}
      >
        {w}
      </span>
      {i < words.length - 1 && " "}
    </span>
  ));
}

export function Reviews() {
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);
  const [active, setActive] = useState(0);
  const [run, setRun] = useState(0); // a new turn for the active quote: it writes itself again, its line refills
  const [phase, setPhase] = useState<"static" | "waiting" | "writing">("static");
  const [inView, setInView] = useState(false);
  const [held, setHeld] = useState(false); // hovered or focused
  const [paused, setPaused] = useState(false); // the pause button
  const box = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // faint until it's half on screen, then it writes itself; the lines only run while it's there
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        setPhase((p) => (e.isIntersecting ? "writing" : p === "static" ? "waiting" : p));
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const choose = (i: number) => {
    setActive(i);
    setRun((r) => r + 1);
  };
  const running = !reduced && phase === "writing" && inView && !held && !paused;

  // the tabs' arrow keys, as tabs go: left and right move between reviewers
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = (active + step + reviews.length) % reviews.length;
    choose(i);
    tabs.current[i]?.focus();
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false);
  };

  return (
    <Section className={letterSerif.variable}>
      <Container className="max-w-[880px]">
        <Reveal>
          <div
            ref={box}
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={() => setHeld(false)}
            // keyboard focus holds it (a click is just the hover's)
            onFocus={(e) => e.target.matches(":focus-visible") && setHeld(true)}
            onBlur={onBlur}
            className="flex flex-col items-center gap-10 sm:gap-12"
          >
            <SectionBadge icon="/images/home/reviews-badge-icon.svg">Reviews</SectionBadge>

            {/* every quote in the same cell, so the block keeps the longest one's height */}
            <div id="review-quote" role="tabpanel" aria-labelledby={`review-tab-${active}`} className="grid w-full">
              {reviews.map((r, i) => (
                <blockquote
                  key={r.author}
                  aria-hidden={i !== active}
                  className={cn(
                    "col-start-1 row-start-1 text-center font-[family-name:var(--font-letter)] text-[24px] leading-[34px] tracking-[-0.01em] text-balance text-warm-900 transition-opacity duration-500 sm:text-[34px] sm:leading-[46px] motion-reduce:transition-none",
                    i === active ? "opacity-100" : "opacity-0",
                  )}
                >
                  {i === active ? <Inked key={run} text={r.quote} phase={phase} /> : `“${r.quote}”`}
                </blockquote>
              ))}
            </div>

            {/* the tabs centred under the quote; the pause button hangs just past their end (on phones, beside them) */}
            <div className="relative flex w-full max-w-[600px] items-start gap-3">
              <div role="tablist" aria-label="Reviews" onKeyDown={onKeyDown} className="grid flex-1 grid-cols-3 gap-4 sm:gap-6">
                {reviews.map((r, i) => {
                  const [name, context] = r.author.split(" - ");
                  const on = i === active;
                  return (
                    <button
                      key={r.author}
                      ref={(el) => {
                        tabs.current[i] = el;
                      }}
                      id={`review-tab-${i}`}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-controls="review-quote"
                      tabIndex={on ? 0 : -1}
                      onClick={() => choose(i)}
                      className="group flex flex-col gap-3 rounded-[4px] text-left outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
                    >
                      {/* the reviewer's line: it fills while their quote is up, then hands on */}
                      <span className="relative block h-0.5 overflow-hidden rounded-full bg-warm-200 transition-colors group-hover:bg-warm-300">
                        {on && (
                          <span
                            key={run}
                            onAnimationEnd={() => choose((active + 1) % reviews.length)}
                            className={cn("absolute inset-0 origin-left rounded-full bg-warm-900", !reduced && "animate-tab-fill")}
                            style={reduced ? undefined : { animationPlayState: running ? "running" : "paused" }}
                          />
                        )}
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className={cn("type-small font-medium transition-colors duration-300", on ? "text-text-primary" : "text-text-tertiary group-hover:text-text-secondary")}>
                          {name}
                        </span>
                        {context && <span className="type-caption text-text-tertiary">{context}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!reduced && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  // TODO(client): new microcopy (the pause button's name for screen readers)
                  aria-label={paused ? "Play reviews" : "Pause reviews"}
                  onClick={() => setPaused((p) => !p)}
                  className="-mt-2 shrink-0 text-text-tertiary sm:absolute sm:top-0 sm:left-full sm:ml-4"
                >
                  {paused ? <PlayIcon /> : <PauseIcon />}
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
