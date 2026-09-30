import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, PhoneIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";

export function Hero() {
  return (
    <PageHero
      illustration={{ src: "/images/blog/hero-illustration.png" }}
      title="Resource center"
      subtitle="Guides, insights, and perspectives on mental health — written by your providers"
    >
      {/* Mobile stacks full-width with Lifeline first; desktop sits side by side with Call first */}
      <div className="flex w-full max-w-[360px] flex-col justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        <Button asChild variant="secondary" size="md" fullWidth="mobile" className="order-2 sm:order-1">
          <a href="tel:988">
            Call
            <PhoneIcon />
          </a>
        </Button>
        <Button asChild variant="secondary" size="md" fullWidth="mobile" className="order-1 sm:order-2">
          <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer">
            988 Suicide &amp; Crisis Lifeline
            <ArrowUpRightIcon />
          </a>
        </Button>
      </div>
      <p className="type-small text-text-tertiary sm:type-body">If you need to talk, the 988 Lifeline is here</p>
    </PageHero>
  );
}
