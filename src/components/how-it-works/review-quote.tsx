import { Reveal } from "@/components/reveal";
import { ReviewBlock } from "@/components/shared/review-block";
import { Container, Section } from "@/components/ui/section";

export function ReviewQuote() {
  return (
    <Section>
      <Container className="max-w-[947px]">
        <Reveal className="rounded-card bg-warm-100 px-6 py-12 ring-1 ring-warm-200 ring-inset sm:px-12 sm:py-16">
          <ReviewBlock
            badgeIcon="/images/how-it-works/reviews-badge-icon.svg"
            quote="I had tried to find a provider for months. PsychMind took me twenty minutes. I've been seeing my provider for six months now."
            author="Sara A. - Needed help with ADHD"
          />
        </Reveal>
      </Container>
    </Section>
  );
}
