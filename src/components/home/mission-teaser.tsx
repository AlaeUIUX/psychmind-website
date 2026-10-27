import { Reveal } from "@/components/reveal";
import { Container, Section } from "@/components/ui/section";
import { SectionBadge } from "@/components/ui/section-badge";
import { FoundersLetter } from "./founders-letter";
import { letterSerif } from "./letter-serif";

// "Meet the creators": their doodle standing on their note, a letter that
// writes itself as you scroll (founders-letter.tsx), in its book serif
// (letter-serif.ts); the signatures are set in it too, for now.

export function MissionTeaser() {
  return (
    <Section className={letterSerif.variable}>
      <Container className="flex flex-col items-center">
        {/* the badge, the founders' doodle and the letter are pinned together */}
        <FoundersLetter
          badge={
            <Reveal>
              <SectionBadge icon="/images/home/meet-creators-icon.svg">Meet the creators</SectionBadge>
            </Reveal>
          }
        />
      </Container>
    </Section>
  );
}
