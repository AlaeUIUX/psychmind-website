"use client";

import { useRef } from "react";
import { privacyPromises, verifySteps } from "@/components/shared/trust-content";
import { DoodleCheck, DoodleSparkle } from "@/components/ui/doodles";
import { Container } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { GUTTER } from "@/components/ui/section";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// A dark band between the profile and the reviews: how every provider is
// verified, and what we promise about your privacy. Same content as the home
// page's Verified providers panel, told as its own chapter here.
export function SafetyBand() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        gsap.fromTo(
          q("[data-sheet]"),
          { clipPath: "inset(0% 4% 0% 4% round 40px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 25%", scrub: true },
          },
        );
        gsap.from(q("[data-step]"), {
          y: 50,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: q("[data-steps]")[0], start: "top 80%", once: true },
        });
        gsap.from(q("[data-tick] [data-draw]"), {
          drawSVG: 0,
          stagger: 0.3,
          duration: 0.6,
          ease: "power2.inOut",
          scrollTrigger: { trigger: q("[data-steps]")[0], start: "top 70%", once: true },
        });
        gsap.from(q("[data-promise]"), {
          x: -20,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 0.8,
          scrollTrigger: { trigger: q("[data-promises]")[0], start: "top 80%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="w-full py-6">
      <div data-sheet data-header-dark className="grain relative overflow-hidden bg-warm-950 text-warm-25">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-brand-primary/20 blur-[110px]" />
        <span aria-hidden className="absolute top-16 right-[18%] size-5 text-warm-300/40">
          <DoodleSparkle className="size-full" />
        </span>
        <div className={`${GUTTER} relative py-20 sm:py-28 md:py-32`}>
          <Container className="flex flex-col gap-12 sm:gap-16">
            <SectionHeader
              inverted
              badge={{ icon: "/images/how-it-works/profiles-badge-icon.svg", label: "Safety" }}
              title="Care you can check before you commit"
              subtitle="Every provider is verified by a person before they appear in a search — and your information stays yours."
            />

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
              <ol data-steps className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-8">
                {verifySteps.map((s, i) => (
                  <li
                    key={s.title}
                    data-step
                    className="flex flex-col gap-4 rounded-card border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:bg-white/[0.07]"
                  >
                    <span className="relative flex size-10 items-center justify-center rounded-full border border-white/20 font-display text-lg text-warm-25">
                      {i + 1}
                      <span data-tick className="absolute -top-2 -right-3 w-6 text-brand-primary">
                        <DoodleCheck className="w-full" />
                      </span>
                    </span>
                    <p className="type-title text-warm-25">{s.title}</p>
                    <p className="type-body text-warm-300">{s.body}</p>
                  </li>
                ))}
              </ol>

              <div data-promises className="flex flex-col gap-4 lg:col-span-4">
                <p className="flex items-center gap-2 type-small font-medium tracking-[0.06em] text-warm-300 uppercase">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                    <rect x="5.5" y="11" width="13" height="9" rx="2.5" fill="currentColor" stroke="none" />
                  </svg>
                  Our privacy promise
                </p>
                <ul className="flex flex-col divide-y divide-white/10 border-y border-white/10">
                  {privacyPromises.map((line) => (
                    <li key={line} data-promise className="flex gap-3 py-4 type-body text-warm-100">
                      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-primary" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
