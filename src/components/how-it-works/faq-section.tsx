"use client";

import { cn } from "cn";
import Link from "next/link";
import { useId, useState } from "react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { PlusIcon, SendIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { faqs } from "./faq-data";
import { CrisisCard } from "@/components/shared/crisis-card";


/** The accordion on its own, so the home page can show a shorter list. */
export function FaqAccordion({ items = faqs }: { items?: typeof faqs }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <Reveal stagger className="flex flex-col border-t border-warm-200">
      {items.map((faq, i) => {
        const hasAnswer = Boolean(faq.answer);
        const open = hasAnswer && openIndex === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={faq.question} className="border-b border-warm-200">
            <h3>
              <button
                id={buttonId}
                type="button"
                disabled={!hasAnswer}
                aria-expanded={hasAnswer ? open : undefined}
                aria-controls={hasAnswer ? panelId : undefined}
                onClick={() => setOpenIndex(open ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-5 text-left type-body-lg font-medium text-text-primary enabled:cursor-pointer sm:py-6"
              >
                {faq.question}
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border border-warm-300 text-warm-700 transition-[rotate,background-color,border-color,color] duration-300 ease-out-soft",
                    open && "rotate-45 border-warm-900 bg-warm-900 text-white",
                    hasAnswer ? "group-hover:border-warm-600" : "opacity-40",
                  )}
                >
                  <PlusIcon className="size-4" />
                </span>
              </button>
            </h3>
            {hasAnswer && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-500 ease-out-soft",
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="max-w-[640px] pr-14 pb-6 type-body text-text-tertiary">{faq.answer}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </Reveal>
  );
}

export function FaqSection() {
  return (
    <Section spacing="lg" id="faq" className="scroll-mt-24">
      <Container className="flex max-w-[768px] flex-col gap-10 sm:gap-14">
        <SectionHeader
          align="center"
          badge={{ icon: "/images/how-it-works/faq-badge-icon.svg", label: "Common questions" }}
          title="A few things people wonder before starting"
        />

        <FaqAccordion />

        <Reveal>
          <CrisisCard />
        </Reveal>

        <Reveal className="flex flex-col items-center gap-6 rounded-card bg-warm-100 px-6 pt-8 pb-10 text-center ring-1 ring-warm-200 ring-inset sm:gap-8">
          <div className="flex -space-x-3">
            {["avatar-1.png", "avatar-2.png", "avatar-3.png"].map((src, i) => (
              <img
                key={src}
                src={`/images/how-it-works/${src}`}
                alt=""
                className="rounded-full border-2 border-white object-cover shadow-control"
                style={{ width: i === 1 ? 56 : 48, height: i === 1 ? 56 : 48, zIndex: i === 1 ? 1 : 0 }}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            <h3 className="type-h4 text-text-primary">Still have questions?</h3>
            <p className="max-w-[358px] type-body text-text-tertiary">
              Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
            </p>
          </div>
          <Button asChild variant="secondary" size="lg">
            <Link href="/contact">
              Contact us
              <SendIcon />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </Section>
  );
}
