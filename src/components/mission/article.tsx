import { Reveal } from "@/components/reveal";
import { AuthorBar } from "@/components/shared/author-bar";
import { PageHero } from "@/components/ui/page-hero";
import { Container, Section } from "@/components/ui/section";

function FounderAvatar() {
  return (
    <span className="flex size-10 items-center justify-center rounded-full border border-warm-200 bg-warm-100 ring-2 ring-warm-25">
      <img src="/images/mission/user-icon.svg" alt="" width={16} height={16} />
    </span>
  );
}

export function MissionArticle() {
  return (
    <article>
      <PageHero
        eyebrow="Our mission"
        title="The home for your mind's wellbeing"
        illustration={{
          src: "/images/mission/hero-illustration.png",
          after: true,
          fit: "contain",
          className: "w-[280px] aspect-[280/188] sm:w-[500px] sm:aspect-[500/216] md:w-[668px] md:aspect-[668/288]",
        }}
      />

      <Section spacing="none" className="pb-20 sm:pb-28 md:pb-32">
        <Container size="prose" className="flex flex-col gap-12">
          <Reveal stagger className="flex flex-col gap-6 type-body-lg text-text-tertiary">
            <p>
              PsychMind was created by Dani, a mental health provider and small practice owner,
              and Bri, who works behind the scenes supporting patients every day.
            </p>
            <p>As larger platforms grew, they noticed something important getting lost;</p>
            <p>
              Connection, visibility for independent providers, and a simple way for patients to
              find the right fit. Existing directories didn&apos;t reflect how providers actually
              practice — across multiple states, licenses, and locations.
            </p>
            <p>
              PsychMind was built to change that: making it easier for patients to find care, and
              for providers to be seen.
            </p>
          </Reveal>

          <Reveal className="flex gap-5">
            <span className="w-0.5 shrink-0 rounded-full bg-brand-primary" />
            <p className="py-2 type-h4 text-text-primary">
              If you are here for the first time, welcome!
              <br />
              We are glad you found us.
            </p>
          </Reveal>

          <Reveal>
            <AuthorBar
              name="PsychMind Team"
              role="PsychMind co-founders"
              avatar={
                <div className="flex -space-x-3">
                  <FounderAvatar />
                  <FounderAvatar />
                </div>
              }
            />
          </Reveal>
        </Container>
      </Section>
    </article>
  );
}
