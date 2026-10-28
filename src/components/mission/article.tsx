import { HeroIntro } from "@/components/how-it-works/hero";
import { FoundersLetter, type Letter } from "@/components/home/founders-letter";
import { letterSerif } from "@/components/home/letter-serif";
import { SocialLinks } from "@/components/shared/social-links";
import { Container, Section } from "@/components/ui/section";

// The hero as How it works opens (pill, headline, lede), then the mission as the founders' letter from the landing page's "Meet the creators" (their
// doodle on it, writing itself as you scroll): the story as its note, the welcome as its
// closing line in the larger serif, the two signatures, and under them the team and
// PsychMind's social accounts.

const MISSION: Letter = {
  prewritten: true,
  note: [
    "PsychMind was created by Dani, a mental health provider and small practice owner, and Bri, who works behind the scenes supporting patients every day.",
    "As larger platforms grew, they noticed something important getting lost;",
    "Connection, visibility for independent providers, and a simple way for patients to find the right fit. Existing directories didn't reflect how providers actually practice — across multiple states, licenses, and locations.",
    "PsychMind was built to change that: making it easier for patients to find care, and for providers to be seen.",
  ],
  line: {
    wide: ["If you are here for the first time, welcome!", "We are glad you found us."],
    narrow: ["If you are here for the first", "time, welcome!", "We are glad you found us."],
  },
  signedBy: (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-[13px] leading-5 font-medium text-warm-900">PsychMind Team</p>
        <p className="text-[13px] leading-5 text-warm-500">PsychMind co-founders</p>
      </div>
      <SocialLinks />
    </div>
  ),
};

export function MissionArticle() {
  return (
    <article>
      {/* TODO(client): the lede is the mission's last paragraph, without its opening */}
      <HeroIntro
        badge="Our mission"
        title="The home for your mind's wellbeing"
        lede="Making it easier for patients to find care, and for providers to be seen."
      />

      <Section spacing="none" className={`pb-20 sm:pb-28 md:pb-32 ${letterSerif.variable}`}>
        <Container className="flex flex-col items-center">
          <FoundersLetter letter={MISSION} />
        </Container>
      </Section>
    </article>
  );
}
