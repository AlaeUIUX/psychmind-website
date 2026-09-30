import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { AuthorBar } from "@/components/shared/author-bar";
import { ChevronRightIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";
import { Container, Section } from "@/components/ui/section";

export type LegalSection = {
  heading: string;
  paragraphs: ReactNode[];
};

export type LegalCrossLink = {
  label: string;
  href: string;
};

type LegalPageProps = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  crossLinks: LegalCrossLink[];
};

export function LegalPage({ title, lastUpdated, sections, crossLinks }: LegalPageProps) {
  return (
    <>
      <PageHero title={title} subtitle={`Last updated: ${lastUpdated}`} className="pb-10 sm:pb-14" />

      <Section spacing="none" className="pb-20 sm:pb-28 md:pb-32">
        <Container size="prose" className="flex flex-col">
          <div className="flex flex-col gap-10">
            {sections.map((section) => (
              <Reveal key={section.heading} className="flex flex-col gap-4">
                <h2 className="type-h4 text-text-primary">{section.heading}</h2>
                <div className="flex flex-col gap-5 type-body-lg text-text-tertiary">
                  {section.paragraphs.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal stagger className="flex flex-col gap-3 py-12 sm:flex-row">
            {crossLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-1 items-center justify-between gap-4 rounded-card border border-warm-200 bg-warm-50 p-5 transition-[border-color,box-shadow,translate] duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-warm-300 hover:shadow-card sm:p-6"
              >
                <span className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-2.5">
                    <img src="/images/legal/doc-icon.svg" alt="" width={16} height={16} />
                    <span className="type-small font-medium text-text-primary">{link.label}</span>
                  </span>
                  <span className="type-small text-text-tertiary">Last updated: {lastUpdated}</span>
                </span>
                <ChevronRightIcon className="size-4 text-warm-600 transition-[translate] duration-300 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </Reveal>

          <AuthorBar name="PsychMind Team" role="Legal department" />
        </Container>
      </Section>
    </>
  );
}
