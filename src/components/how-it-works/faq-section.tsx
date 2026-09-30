"use client";

import { cn } from "cn";
import Link from "next/link";
import { useId, useState } from "react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { PlusIcon, SendIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

// Placeholder answers until the client supplies final copy. An entry without
// an answer renders as a plain, non-expandable row.
const faqs: { question: string; answer?: string }[] = [
  {
    question: "Is my search completely private?",
    answer:
      "Yes. We never share your personal information with anyone — not your provider, not third parties. Your search is yours alone.",
  },
  {
    question: "What if I pick the wrong person?",
    answer:
      "That's completely okay — finding the right fit sometimes takes more than one try. You can reach out to a different provider at any time, with no fees or awkward explanations needed. Fit matters more than anything, so we make it easy to keep looking.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "Each provider sets their own cancellation policy, and it's always shown on their profile before you send a request. Most ask for at least 24 hours' notice if you need to reschedule or cancel.",
  },
  {
    question: "Do I need a referral or diagnosis?",
    answer:
      "No. You can search, message providers and request a session without a referral or a diagnosis. If your insurance plan requires one, your provider can walk you through the next steps.",
  },
  {
    question: "Do providers accept insurance?",
    answer:
      "Many do. Use the insurance filter to see providers who accept your plan, and check each profile for details. Session fees are set by each provider and are always listed upfront.",
  },
  {
    question: "Can I see someone online?",
    answer:
      "Yes. Filter by Online to find providers who offer video sessions, or In-person to find someone near you. Many providers offer both, so you can switch whenever it suits you.",
  },
  {
    question: "Is PsychMind a therapy service?",
    answer:
      "No — PsychMind is a directory that helps you find and contact independent, verified providers. Your care, scheduling and payments are arranged directly between you and the provider you choose.",
  },
  {
    question: "What if I need help right now?",
    answer:
      "If you're in crisis or thinking about harming yourself, call or text 988 to reach the Suicide & Crisis Lifeline, available 24/7. In an emergency, call 911. PsychMind isn't designed for urgent or emergency care.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <Section spacing="lg">
      <Container className="flex max-w-[768px] flex-col gap-10 sm:gap-14">
        <SectionHeader
          align="center"
          badge={{ icon: "/images/how-it-works/faq-badge-icon.svg", label: "Common questions" }}
          title="A few things people wonder before starting"
        />

        <Reveal stagger className="flex flex-col border-t border-warm-200">
          {faqs.map((faq, i) => {
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
