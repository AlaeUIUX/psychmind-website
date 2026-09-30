"use client";

import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { DoodleSparkle, DoodleUnderline } from "@/components/ui/doodles";
import { Container, Section } from "@/components/ui/section";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// The other side of the marketplace: a slim crimson band inviting providers
// in (the provider onboarding + dashboard live in the Figma file).
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
          { clipPath: "inset(0% 6% 0% 6% round 32px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 32px)",
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
      <Container size="wide">
        <div
          ref={root}
          className="grain relative flex flex-col items-start gap-8 overflow-hidden rounded-[32px] bg-brand-primary px-6 py-10 text-white sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:px-16"
        >
          <span aria-hidden className="absolute top-6 right-[38%] size-5 text-white/50">
            <DoodleSparkle className="size-full" />
          </span>
          <span aria-hidden className="absolute bottom-8 left-[46%] size-3 text-white/40">
            <DoodleSparkle className="size-full" />
          </span>

          <div className="flex max-w-[620px] flex-col gap-3">
            <p className="type-small font-medium tracking-[0.08em] text-white/70 uppercase">For providers</p>
            <h2 className="type-h2 text-white">
              Are you a provider?{" "}
              <span className="relative inline-block italic">
                Join PsychMind.
                <span className="absolute -bottom-1.5 left-0 h-3 w-full text-white/80">
                  <DoodleUnderline className="size-full" />
                </span>
              </span>
            </h2>
            <p className="type-body-lg text-white/80">
              Build a verified profile, show how you practice, and get found by the people looking
              for exactly what you offer.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Button asChild variant="inverse" size="lg">
              <Link href="/signup?role=provider">
                Join as a provider
                <CircleArrowIcon />
              </Link>
            </Button>
            <Button asChild variant="outline-light" size="lg">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
