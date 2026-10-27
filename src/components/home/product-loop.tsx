"use client";

import { useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { PrivacyVisual, RequestVisual, SearchVisual, VerifiedVisual } from "./bento-previews";

// "Discovery" as a bento box: the whole product loop in four cards (search,
// verify, request, privacy), styled after sort.to's feature cards: warm
// off-white with a hairline, the product shown small in the top of the card
// and fading out at its foot, then a centred 18px title over 15px text. The
// pictures of the product share the hero search bar's look (bento-previews.tsx).
// The cards aren't links and nothing in them is clickable: each preview plays
// only while its own card is hovered, and settles back when the pointer leaves.

type CardProps = {
  title: string;
  body: string;
  visual: (active: boolean) => ReactNode;
};

// sort.to's card: 20px corners, 32px sides, 40 at the foot, the visual in a
// band across the top, faded out over its last fifth, the text at the foot.
// The band is in flow, so on narrow cards longer copy makes the card taller
// instead of running up into the visual.
function LoopCard({ title, body, visual }: CardProps) {
  const [active, setActive] = useState(false);
  return (
    <article
      data-card
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className="flex flex-col overflow-hidden rounded-card border border-warm-200 bg-warm-100 px-8 pb-10 text-center transition-colors duration-300 hover:border-warm-300"
    >
      {/* The preview: left-aligned (the card's text is centred) and in the
          hero's Inter. Each runs past the band's foot, so its lower corners
          are cut off under the fade. */}
      <div
        aria-hidden
        className="type-scope-sort pointer-events-none -mx-8 flex h-[236px] justify-center overflow-hidden px-6 pt-7 text-left select-none [mask-image:linear-gradient(to_bottom,black_80%,transparent)] lg:px-8"
      >
        <div className="w-full max-w-[428px]">{visual(active)}</div>
      </div>
      <div className="mt-auto pt-5">
        <h3 className="type-card-title">{title}</h3>
        <p className="type-card-body mx-auto mt-3 max-w-[384px]">{body}</p>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- section */

export function ProductLoop() {
  const root = useRef<HTMLDivElement>(null);

  // The cards rise into place, one after the other, as the grid scrolls in.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(gsap.utils.toArray<HTMLElement>("[data-card]", root.current), {
          y: 40,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section spacing="lg">
      <Container className="flex flex-col gap-10 sm:gap-12">
        <SectionHeader
          align="center"
          badge={{ icon: "/images/home/discovery-icon-32.svg", label: "Discovery" }}
          title="Everything you need to begin your journey"
          // TODO(client): new copy
          subtitle="Search, check and book a provider in one place, with your privacy kept the whole way."
        />
      </Container>

      <Container className="mt-10 sm:mt-12">
        <div ref={root} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <LoopCard
            title="Smart search"
            body="Find providers by specialty, approach, language, gender, and price range."
            visual={(active) => <SearchVisual active={active} />}
          />
          <LoopCard
            title="Verified profiles"
            body="Every credential is manually checked by our team before a provider ever appears in a search."
            visual={(active) => <VerifiedVisual active={active} />}
          />
          <LoopCard
            title="Book in seconds"
            body="Message a provider, pick a time that works for you, and you're set. No phone tag, no waitlists."
            visual={(active) => <RequestVisual active={active} />}
          />
          <LoopCard
            title="Complete confidentiality"
            body="Your information is never shared or sold. Messages with a provider stay between you and them."
            visual={(active) => <PrivacyVisual active={active} />}
          />
        </div>
      </Container>

      <Reveal className="mt-12 sm:mt-16">
        <p className="mx-auto max-w-[462px] text-center type-quote-sm text-text-tertiary">
          &ldquo;PsychMind makes it simple to find the right professional.&rdquo; No referrals, no
          waitlists, no awkward phone calls.
        </p>
      </Reveal>
    </Section>
  );
}
