import type { Metadata } from "next";
import { FaqSection } from "@/components/how-it-works/faq-section";
import { providerFaqs } from "@/components/how-it-works/faq-data";
import { HeroIntro } from "@/components/how-it-works/hero";
import { HeroShowcase } from "@/components/how-it-works/hero-showcase";
import { ProviderSteps } from "@/components/how-it-works/provider-steps";

// How it works for providers, built from the people-side page's parts: the hero over
// the drifting collage (its middle a provider's profile, as people see it), the three
// steps from the provider's side, and the questions providers ask, with the way to the
// team. TODO(client): new page and copy (2026-10-28); the steps and questions are
// listed in provider-steps.tsx and faq-data.ts.
export const metadata: Metadata = {
  title: "How it works for providers — PsychMind",
  description:
    "Build a verified profile, show how you practice, and get found by the people looking for exactly what you offer.",
};

export default function ProvidersHowItWorksPage() {
  return (
    <>
      <HeroIntro
        badge="For providers"
        title="How PsychMind works for providers"
        lede="Build a verified profile, show how you practice, and get found by the people looking for exactly what you offer."
        cta={{ href: "/signup?role=provider", label: "Join as a provider" }}
      >
        <HeroShowcase />
      </HeroIntro>
      <ProviderSteps />
      <FaqSection title="A few things providers ask before joining" items={providerFaqs} />
    </>
  );
}
