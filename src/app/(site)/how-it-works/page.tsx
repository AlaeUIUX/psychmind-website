import type { Metadata } from "next";
import { Hero } from "@/components/how-it-works/hero";
import { ProcessSteps } from "@/components/how-it-works/process-steps";
import { ProfileShowcase } from "@/components/how-it-works/profile-showcase";
import { ReviewQuote } from "@/components/how-it-works/review-quote";
import { FaqSection } from "@/components/how-it-works/faq-section";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "How it works — PsychMind",
  description:
    "No referrals. No waitlists. Just a clear, guided path to the professional who is right for you.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Reveal>
        <Hero />
      </Reveal>
      <Reveal>
        <ProcessSteps />
      </Reveal>
      <Reveal>
        <ProfileShowcase />
      </Reveal>
      <Reveal>
        <ReviewQuote />
      </Reveal>
      <Reveal>
        <FaqSection />
      </Reveal>
    </>
  );
}
