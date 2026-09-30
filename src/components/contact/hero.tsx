import { PageHero } from "@/components/ui/page-hero";

export function Hero() {
  return (
    <PageHero
      className="pb-8 sm:pb-12"
      illustration={{
        src: "/images/contact/hero-illustration.svg",
        fit: "contain",
        className: "w-[220px] aspect-[296/180] sm:w-[260px] md:w-[296px]",
      }}
      title="We would love to hear from you"
      subtitle="Whether you have a question, a thought, or just want to say hello"
    />
  );
}
