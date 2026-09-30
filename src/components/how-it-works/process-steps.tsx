"use client";

import { cn } from "cn";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/reveal";
import { RequestPreview, SearchPreview } from "@/components/shared/product-preview";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

const steps = [
  {
    title: "Tell us what you are looking for",
    description:
      "Answer a few simple questions — where you are, what you'd like to work on, and any preferences about your provider. No medical history required. There are no wrong answers.",
    preview: () => <SearchPreview showResults={false} />,
  },
  {
    title: "Browse matched profiles",
    description:
      "We surface providers that fit your search. Read their approach, check their availability, and message them directly before committing to anything.",
    preview: () => <SearchPreview showSearch={false} />,
  },
  {
    title: "Book your first session",
    description:
      "Pick a time that works for you — online or in person. Your first session is a conversation, not a commitment. You can always switch providers.",
    preview: () => <RequestPreview every={2100} />,
  },
];

const STEP_MS = 6500;
// Circumference of the r=21 progress ring around each step number.
const RING = 2 * Math.PI * 21;

export function ProcessSteps() {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setAutoplay(false), 0);
      return () => clearTimeout(t);
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = autoplay && inView && !hovered;

  function select(i: number) {
    setActive(i);
    setAutoplay(false);
  }

  return (
    <Section>
      <Container className="flex flex-col gap-10 sm:gap-12">
        <SectionHeader
          badge={{ icon: "/images/how-it-works/process-badge-icon.svg", label: "The process" }}
          title="Three steps to your first session"
        />

        <div
          ref={ref}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="flex flex-col items-start gap-8 lg:flex-row lg:gap-12"
        >
          <Reveal stagger as="ol" className="flex w-full flex-1 flex-col">
            {steps.map((step, i) => {
              const current = i === active;
              const past = i < active;
              return (
                <li key={step.title} className="flex gap-5 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <span className="relative flex size-11 shrink-0 items-center justify-center">
                      <span
                        className={cn(
                          "flex size-11 items-center justify-center rounded-full border font-display text-lg shadow-control transition-colors duration-500",
                          current
                            ? "border-warm-900 bg-warm-900 text-white"
                            : past
                              ? "border-warm-300 bg-warm-200 text-warm-900"
                              : "border-warm-300 bg-warm-100 text-warm-600",
                        )}
                      >
                        {i + 1}
                      </span>
                      {/* Timer ring: fills while this step is on screen. */}
                      {current && autoplay && (
                        <svg aria-hidden viewBox="0 0 48 48" className="pointer-events-none absolute -inset-[5px] size-[54px] -rotate-90">
                          <circle cx="24" cy="24" r="21" fill="none" stroke="#e7e5e4" strokeWidth="2" />
                          <circle
                            key={active}
                            cx="24"
                            cy="24"
                            r="21"
                            fill="none"
                            stroke="#c01048"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray={RING}
                            onAnimationEnd={() => setActive((a) => (a + 1) % steps.length)}
                            style={{
                              ["--ring" as string]: RING,
                              animation: `ring-fill ${STEP_MS}ms linear both`,
                              animationPlayState: running ? "running" : "paused",
                            }}
                          />
                        </svg>
                      )}
                    </span>
                    {i < steps.length - 1 && (
                      <span className="relative my-2 w-px flex-1 overflow-hidden bg-warm-200">
                        <span
                          className={cn(
                            "absolute inset-0 origin-top bg-warm-600/60 transition-transform duration-700 ease-out-soft",
                            past ? "scale-y-100" : "scale-y-0",
                          )}
                        />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-5 pt-2 pb-10">
                    <button
                      type="button"
                      onClick={() => select(i)}
                      aria-pressed={current}
                      className="group flex flex-col gap-2 rounded-field text-left"
                    >
                      <h3
                        className={cn(
                          "type-title transition-colors duration-300",
                          current ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary",
                        )}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={cn(
                          "type-body-lg transition-colors duration-300",
                          current ? "text-text-tertiary" : "text-text-placeholder",
                        )}
                      >
                        {step.description}
                      </p>
                    </button>
                    {i === steps.length - 1 && (
                      <Button asChild variant="brand" size="lg" className="w-fit">
                        <Link href="/providers">
                          Start your search
                          <CircleArrowIcon />
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </Reveal>

          {/* Product preview for the step in focus. */}
          <Reveal
            delay={150}
            className="relative flex h-[460px] w-full flex-1 flex-col overflow-hidden rounded-card border border-warm-300/70 bg-warm-200 p-3 shadow-card sm:h-[520px] sm:p-5 lg:sticky lg:top-28"
          >
            <div className="flex items-center justify-between px-1 pb-3">
              <span className="text-xs font-medium text-text-tertiary">
                Step {active + 1} of {steps.length}
              </span>
              <span className="flex gap-1.5">
                {steps.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    aria-label={`Show step ${i + 1}`}
                    onClick={() => select(i)}
                    className="flex h-5 items-center"
                  >
                    <span
                      className={cn(
                        "block h-1.5 rounded-full transition-all duration-500 ease-out-soft",
                        i === active ? "w-5 bg-warm-900" : "w-1.5 bg-warm-600/30 hover:bg-warm-600/60",
                      )}
                    />
                  </button>
                ))}
              </span>
            </div>
            <div key={active} className="flex min-h-0 flex-1 flex-col justify-center-safe overflow-hidden rounded-4xl bg-warm-50 p-3 sm:p-4">
              {steps[active].preview()}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent to-warm-200" />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
