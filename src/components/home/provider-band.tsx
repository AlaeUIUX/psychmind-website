"use client";

import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { DoodleSparkle, DoodleUnderline } from "@/components/ui/doodles";
import { Container, Section } from "@/components/ui/section";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { CtaArrowIcon } from "@/components/ui/hugeicons";

// The other side of the marketplace: a slim band inviting providers in (the
// provider onboarding + dashboard live in the Figma file), in the bento's
// greys: warm-100 with a hairline, ink type, the ink and light buttons.
// Draft copy — TODO(client): approve wording and the sign-up destination.
export function ProviderBand() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        gsap.fromTo(
          root.current,
          { clipPath: "inset(0% 6% 0% 6% round 20px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 20px)",
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "center 60%", scrub: true },
          },
        );
        gsap.from(q("[data-draw]"), {
          drawSVG: 0,
          duration: 0.9,
          ease: "power2.inOut",
          stagger: 0.15,
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section spacing="sm">
      <Container>
        <div
          ref={root}
          className="relative flex flex-col items-start gap-8 overflow-hidden rounded-card border border-warm-200 bg-warm-100 px-6 py-10 sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:px-14"
        >
          <span aria-hidden className="absolute top-6 right-[38%] size-5 text-warm-300">
            <DoodleSparkle className="size-full" />
          </span>
          <span aria-hidden className="absolute bottom-8 left-[46%] size-3 text-warm-300">
            <DoodleSparkle className="size-full" />
          </span>

          <div className="flex max-w-[560px] flex-col gap-3">
            <p className="text-[13px] font-medium text-warm-500">For providers</p>
            <h2 className="type-h2 text-text-primary">
              Are you a provider?{" "}
              <span className="relative inline-block italic">
                Join PsychMind.
                <span className="absolute -bottom-1.5 left-0 h-3 w-full text-warm-400">
                  <DoodleUnderline className="size-full" />
                </span>
              </span>
            </h2>
            <p className="type-hero-sub">
              Build a verified profile, show how you practice, and get found by the people looking
              for exactly what you offer.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/signup?role=provider">
                Join as a provider
                <CtaArrowIcon />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
