"use client";

import { cn } from "cn";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { RequestVisual, SearchVisual } from "@/components/home/bento-previews";
import { Reveal } from "@/components/reveal";
import { CalendarIcon, SearchIcon, UserRoundIcon } from "@/components/ui/hugeicons";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

// The three steps, built as the home page's privacy promise is (home/verified-
// providers.tsx): a thin grey frame round one white card, the steps listed down its
// first column under hairlines, and a grey picture column beside them. Choosing a
// step (pointing at it, tapping it, or the arrow keys) brings in its icon, as the
// privacy promises do on hover, and plays its picture of the product: the bento's
// pictures (bento-previews.tsx), in the hero search bar's look. A step without a
// picture leaves the column grey, for now (the app's screens are being reworked).
// How it works for providers passes its own steps, head and title.

export type Step = { title: string; description: string; Icon: typeof SearchIcon; picture?: (active: boolean) => ReactNode };
export type StepsHead = { title: string; intro: { text: string; strong?: boolean }[][] };

const PEOPLE_STEPS: Step[] = [
  {
    title: "Tell us what you are looking for",
    description:
      "Answer a few simple questions — where you are, what you'd like to work on, and any preferences about your provider. No medical history required. There are no wrong answers.",
    Icon: SearchIcon,
    picture: (active) => <SearchVisual active={active} />,
  },
  {
    title: "Browse matched profiles",
    description:
      "We surface providers that fit your search. Read their approach, check their availability, and message them directly before committing to anything.",
    Icon: UserRoundIcon,
    // TODO: the results, once the app's screens are reworked
  },
  {
    title: "Book your first session",
    description:
      "Pick a time that works for you — online or in person. Your first session is a conversation, not a commitment. You can always switch providers.",
    Icon: CalendarIcon,
    picture: (active) => <RequestVisual active={active} />,
  },
];

// TODO(client): new copy, the card's head (as the privacy promise's "Our privacy
// promise" and its two lines).
const PEOPLE_HEAD: StepsHead = {
  title: "From first search to first session",
  intro: [
    [{ text: "Most directories leave you calling around and waiting to hear back, " }, { text: "we don’t…", strong: true }],
    [
      { text: "You search, read and request in one place: " },
      { text: "no referrals, no phone tag, and nothing shared until you send a request.", strong: true },
    ],
  ],
};

export function ProcessSteps({
  title = "Three steps to your first session",
  steps = PEOPLE_STEPS,
  head = PEOPLE_HEAD,
}: { title?: string; steps?: Step[]; head?: StepsHead } = {}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const delta =
      e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + steps.length) % steps.length;
    refs.current[next]?.focus();
    setActive(next);
  }

  return (
    <Section spacing="lg">
      <Container className="flex flex-col gap-10 sm:gap-12">
        <SectionHeader
          align="center"
          badge={{ icon: "/images/how-it-works/process-badge-icon.svg", label: "The process" }}
          title={title}
        />

        {/* the privacy promise's frame: 20px, then the card's 13px, then the picture's 6px */}
        <Reveal className="rounded-card border border-warm-200 bg-warm-100 p-1.5 sm:w-4/5 sm:self-center lg:w-full">
          <div className="grid rounded-[13px] border border-warm-200 bg-white lg:grid-cols-2">
            {/* as the privacy promise: a head (the chosen step's number as its lead, then
                the title), a line on how we're different, and the steps under a hairline */}
            <div className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warm-100 font-display text-lg text-warm-900"
                >
                  <span key={active} className="animate-fade-in">
                    {active + 1}
                  </span>
                </span>
                <p className="text-[15px] leading-5 font-medium tracking-[-0.01em] text-warm-900">{head.title}</p>
              </div>
              {/* a line each; the point at full ink, the rest at 60% (still AA on white) */}
              <p className="mt-3 text-sm leading-[22px] tracking-[-0.01em] text-balance text-warm-900/60">
                {head.intro.map((line) => (
                  <span key={line[0].text} className="block">
                    {line.map((s) => (s.strong ? <span key={s.text} className="text-warm-900">{s.text}</span> : s.text))}
                  </span>
                ))}
              </p>
            <ol className="mt-4 border-t border-warm-200 pt-1">
              {steps.map((step, i) => {
                const current = i === active;
                const { Icon } = step;
                return (
                  <li key={step.title} className="border-t border-warm-100 first:border-t-0">
                    <button
                      ref={(el) => {
                        refs.current[i] = el;
                      }}
                      type="button"
                      aria-pressed={current}
                      aria-controls="process-picture"
                      onClick={() => setActive(i)}
                      onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                      onKeyDown={(e) => onKeyDown(e, i)}
                      className="relative block w-full py-3 text-left tracking-[-0.01em] outline-none focus-visible:ring-2 focus-visible:ring-warm-300"
                    >
                      {/* as the privacy promises: no icon at rest; chosen, it fades in and the
                          text steps aside for it (keeping that room free, so it never rewraps) */}
                      <Icon
                        className={cn(
                          "absolute top-3.5 left-0 size-4 text-warm-900 transition-[opacity,translate] duration-300 ease-out-soft motion-reduce:transition-none",
                          current ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0",
                        )}
                      />
                      <span
                        className={cn(
                          "flex flex-col gap-0.5 pr-7 transition-[translate] duration-300 ease-out-soft motion-reduce:transition-none",
                          current && "translate-x-7",
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm leading-5 font-medium transition-colors duration-300",
                            current ? "text-warm-900" : "text-warm-900/60",
                          )}
                        >
                          {step.title}
                        </span>
                        <span className="text-[13px] leading-[18px] text-warm-900/60">{step.description}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            </div>

            {/* the picture's column, as the privacy promise's, on the grey (4:3; on desktop as tall as the steps beside it) */}
            <div id="process-picture" className="mx-1.5 mb-1.5 overflow-hidden rounded-[6px] bg-warm-100 lg:m-1.5">
              <div
                aria-hidden
                className="type-scope-sort pointer-events-none relative flex aspect-[4/3] w-full justify-center lg:aspect-auto lg:h-full overflow-hidden px-6 pt-10 text-left select-none [mask-image:linear-gradient(to_bottom,black_75%,transparent)] lg:px-10 lg:pt-12"
              >
                {steps.map((step, i) =>
                  step.picture ? (
                    <div
                      key={step.title}
                      className={cn(
                        "absolute inset-x-6 top-10 mx-auto max-w-[428px] transition-opacity duration-500 ease-out-soft lg:inset-x-10 lg:top-12",
                        i === active ? "opacity-100" : "opacity-0",
                      )}
                    >
                      {step.picture(i === active)}
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
