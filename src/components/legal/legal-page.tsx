import Link from "next/link";
import type { ReactNode } from "react";
import { ShareButtons } from "@/components/shared/share-buttons";

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
    <section className="w-full flex flex-col items-center gap-12 sm:gap-16 px-4 sm:px-8 py-6 sm:py-12 pb-20 sm:pb-32 md:pb-40">
      <div className="w-full flex flex-col items-center gap-3 max-w-[720px] text-center">
        <h1 className="font-display text-warm-900 text-[36px] sm:text-[48px] md:text-display-lg leading-[1.1] md:leading-[60px]">
          {title}
        </h1>
        <p className="text-warm-600 text-lg sm:text-display-xs">Last updated: {lastUpdated}</p>
      </div>

      <div className="w-full max-w-[720px] flex flex-col items-start">
        {sections.map((section, i) => (
          <div key={section.heading} className={`w-full flex flex-col items-start ${i > 0 ? "pt-8" : ""}`}>
            <h2 className="font-display text-warm-900 text-display-xs pb-4 w-full">{section.heading}</h2>
            <div className="text-text-tertiary text-lg leading-[28px] w-full flex flex-col gap-[18px]">
              {section.paragraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}

        <div className="w-full flex flex-col sm:flex-row gap-3 pt-12 pb-12">
          {crossLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 flex flex-col gap-2.5 rounded-2xl border border-warm-200 bg-warm-50 p-6 hover:border-warm-300 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <img src="/images/legal/doc-icon.svg" alt="" width={16} height={16} />
                <span className="text-sm font-medium text-warm-900">{link.label}</span>
              </div>
              <p className="text-sm text-text-secondary">Last updated: {lastUpdated}</p>
            </Link>
          ))}
        </div>

        <div className="w-full flex flex-wrap items-start justify-between gap-y-6 border-t border-warm-200 pt-6">
          <div className="flex flex-col text-md leading-6">
            <span className="font-semibold text-warm-900">PsychMind Team</span>
            <span className="text-text-tertiary">Legal department</span>
          </div>
          <ShareButtons />
        </div>
      </div>
    </section>
  );
}
