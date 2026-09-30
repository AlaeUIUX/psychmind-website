import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { FaqAccordion } from "@/components/how-it-works/faq-section";
import { faqs } from "@/components/how-it-works/faq-data";
import { CrisisCard } from "@/components/shared/crisis-card";
import { ChevronRightIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

// The questions people ask most before starting, plus crisis support that's
// always visible — never hidden behind a click.
const HOME_QUESTIONS = [
  "Is my search completely private?",
  "What if I pick the wrong person?",
  "Do I need a referral or diagnosis?",
  "Do providers accept insurance?",
  "Is PsychMind a therapy service?",
];

export function HomeFaq() {
  const items = faqs.filter((f) => HOME_QUESTIONS.includes(f.question));
  return (
    <Section spacing="lg">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-8 lg:col-span-5">
          <SectionHeader
            badge={{ icon: "/images/how-it-works/faq-badge-icon.svg", label: "Common questions" }}
            title="A few things people wonder before starting"
          />
          <Reveal delay={200}>
            <CrisisCard />
          </Reveal>
        </div>
        <div className="flex flex-col gap-6 lg:col-span-7 lg:pt-4">
          <FaqAccordion items={items} />
          <Reveal>
            <Link
              href="/how-it-works#faq"
              className="group inline-flex items-center gap-1.5 type-body font-medium text-text-primary underline-offset-4 hover:underline"
            >
              See all questions
              <ChevronRightIcon className="size-4 transition-[translate] duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
