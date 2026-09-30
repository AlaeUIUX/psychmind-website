"use client";

import { cn } from "cn";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { Reveal } from "@/components/reveal";
import { RequestPreview, SearchPreview } from "@/components/shared/product-preview";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { DoodleHookArrow } from "@/components/ui/doodles";
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
    preview: () => <RequestPreview every={2100} loop={false} />,
  },
];

// Three steps the visitor explores at their own pace: choose a step and the
// product preview beside it changes to match. Nothing advances on its own.
export function ProcessSteps() {
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
    <Section>
      <Container className="flex flex-col gap-10 sm:gap-12">
        <SectionHeader
          badge={{ icon: "/images/how-it-works/process-badge-icon.svg", label: "The process" }}
          title="Three steps to your first session"
        />

        <div className="flex flex-col items-start gap-8 lg:flex-row lg:gap-12">
          <div className="relative flex w-full flex-1 flex-col gap-3">
            {/* pencil hint */}
            <p
              aria-hidden
              className="pointer-events-none absolute -top-10 right-4 hidden items-end gap-1 font-display text-[15px] text-warm-600 italic lg:flex"
            >
              pick a step
              <DoodleHookArrow className="h-10 w-6 translate-y-6 -scale-x-100" />
            </p>

            <Reveal stagger as="ol" className="flex flex-col gap-3">
              {steps.map((step, i) => {
                const current = i === active;
                return (
                  <li key={step.title}>
                    <button
                      ref={(el) => {
                        refs.current[i] = el;
                      }}
                      type="button"
                      aria-pressed={current}
                      aria-controls="process-preview"
                      onClick={() => setActive(i)}
                      onKeyDown={(e) => onKeyDown(e, i)}
                      className={cn(
                        "group flex w-full gap-4 rounded-card border p-5 text-left transition-[background-color,border-color,box-shadow,translate] duration-500 ease-out-soft sm:gap-5 sm:p-6",
                        current
                          ? "border-warm-200 bg-white shadow-card"
                          : "border-transparent hover:-translate-y-0.5 hover:border-warm-200 hover:bg-warm-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-full border font-display text-lg transition-colors duration-500",
                          current
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-warm-300 bg-warm-100 text-warm-700 group-hover:border-warm-600/40",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="flex flex-col gap-2 pt-1.5">
                        <span
                          className={cn(
                            "type-title transition-colors duration-300",
                            current ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary",
                          )}
                        >
                          {step.title}
                        </span>
                        {/* the chosen step opens up; on phones the others fold away */}
                        <span
                          className={cn(
                            "grid transition-[grid-template-rows,opacity] duration-500 ease-out-soft",
                            current
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0 lg:grid-rows-[1fr] lg:opacity-55",
                          )}
                        >
                          <span className="min-h-0 overflow-hidden type-body-lg text-text-tertiary">{step.description}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </Reveal>

            <Reveal className="pt-3 pl-5 sm:pl-6">
              <Button asChild variant="brand" size="lg" className="w-fit">
                <Link href="/providers">
                  Start your search
                  <CircleArrowIcon />
                </Link>
              </Button>
            </Reveal>
          </div>

          {/* Product preview for the chosen step. */}
          <Reveal
            delay={150}
            className="relative flex h-[460px] w-full flex-1 flex-col overflow-hidden rounded-card border border-warm-200 bg-warm-100 p-3 shadow-card sm:h-[520px] sm:p-5 lg:sticky lg:top-28"
          >
            <p className="px-1 pb-3 text-xs font-medium text-text-tertiary" aria-live="polite">
              Step {active + 1} of {steps.length} · {steps[active].title}
            </p>
            <div
              id="process-preview"
              key={active}
              className="flex min-h-0 flex-1 animate-fade-in flex-col justify-center-safe overflow-hidden rounded-4xl bg-white p-3 ring-1 ring-warm-200 sm:p-4"
            >
              {steps[active].preview()}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-warm-100" />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
