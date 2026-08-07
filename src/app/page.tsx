import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { SmartSearchFeature } from "@/components/home/smart-search-feature";
import { TestimonialCard } from "@/components/home/testimonial-card";
import { DesktopTestimonials } from "@/components/home/desktop-testimonials";
import { MissionTeaser } from "@/components/home/mission-teaser";
import { ResourcePreview } from "@/components/home/resource-preview";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <SmartSearchFeature />
      <TestimonialCard />
      <DesktopTestimonials />
      <MissionTeaser />
      <ResourcePreview />
    </>
  );
}
