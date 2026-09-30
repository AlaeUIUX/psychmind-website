import { Hero } from "@/components/home/hero";
import { QuestionsBand } from "@/components/home/questions-band";
import { ProductLoop } from "@/components/home/product-loop";
import { VerifiedProviders } from "@/components/home/verified-providers";
import { TestimonialCard } from "@/components/home/testimonial-card";
import { DesktopTestimonials } from "@/components/home/desktop-testimonials";
import { MissionTeaser } from "@/components/home/mission-teaser";
import { ResourcePreview } from "@/components/home/resource-preview";
import { ProviderBand } from "@/components/home/provider-band";
import { HomeFaq } from "@/components/home/home-faq";

// Running order: the search (with its trust row) → the questions people
// carry in → the product loop that answers them → the people behind it →
// what others say → why it exists → learning → providers → FAQ & crisis help.
export default function Home() {
  return (
    <>
      <Hero />
      <QuestionsBand />
      <ProductLoop />
      <VerifiedProviders />
      <TestimonialCard />
      <DesktopTestimonials />
      <MissionTeaser />
      <ResourcePreview />
      <ProviderBand />
      <HomeFaq />
    </>
  );
}
