import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { SectionBadge } from "@/components/ui/section-badge";
import { CtaArrowIcon } from "@/components/ui/hugeicons";
import { HeroShowcase } from "./hero-showcase";

// The home hero's layout (home/hero.tsx), without its search: the pill where the home
// page has its figures, the serif headline and lede, then the button where the home
// page has its search bar. No top padding: the header leaves it. Both How it works
// pages open with it (for people looking for care, and for providers), and the mission.
export function HeroIntro({
  badge,
  title,
  lede,
  cta,
  note,
  children,
}: {
  badge: string;
  title: ReactNode;
  lede: ReactNode;
  /** The button (the mission page has none). */
  cta?: { href: string; label: string };
  note?: ReactNode;
  /** What comes under it, such as the showcase. */
  children?: ReactNode;
}) {
  return (
    <section className="pb-8 text-center sm:pb-12">
      <div className="px-6">
        <Reveal trigger="load">
          <div className="type-scope-sort flex justify-center">
            <SectionBadge icon="/images/home/discovery-icon-32.svg">{badge}</SectionBadge>
          </div>
          <h1 className="type-hero-title mx-auto mt-4 max-w-2xl text-balance">{title}</h1>
          <p className="type-hero-lede mx-auto mt-4 max-w-xl text-balance">{lede}</p>
          {cta && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button asChild variant="brand" size="lg">
                <Link href={cta.href}>
                  {cta.label}
                  <CtaArrowIcon />
                </Link>
              </Button>
              {note && <p className="type-small text-text-tertiary">{note}</p>}
            </div>
          )}
        </Reveal>
      </div>
      {children}
    </section>
  );
}

/** How it works, for people looking for care: the intro, then the experience over its
 *  drifting collage (hero-showcase.tsx). */
export function Hero() {
  return (
    <HeroIntro
      badge="How it works"
      title="Finding the right provider should feel simple"
      lede="No referrals. No waitlists. Just a clear, guided path to the professional who is right for you."
      cta={{ href: "/providers", label: "Start your search" }}
      note="Takes less than 2 minutes. Free to browse."
    >
      <HeroShowcase />
    </HeroIntro>
  );
}
