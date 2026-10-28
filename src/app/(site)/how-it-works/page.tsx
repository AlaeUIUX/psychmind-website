import type { Metadata } from "next";
import { Hero } from "@/components/how-it-works/hero";
import { ProcessSteps } from "@/components/how-it-works/process-steps";
import { FaqSection } from "@/components/how-it-works/faq-section";
import { Reviews } from "@/components/home/reviews";
import { ProviderBand } from "@/components/home/provider-band";
import { Voyage } from "@/components/home/voyage";

export const metadata: Metadata = {
  title: "How it works — PsychMind",
  description:
    "No referrals. No waitlists. Just a clear, guided path to the professional who is right for you.",
};

// Running order: the hero and its showcase → the three steps → the home page's
// reviews → the common questions → then, as a way on to somewhere else, her boat
// sailing the S down to the provider band.
export default function HowItWorksPage() {
  return (
    <>
      <Hero />
      <ProcessSteps />
      <Reviews />
      <FaqSection />
      <Voyage />
      <ProviderBand voyageEnd />
    </>
  );
}
