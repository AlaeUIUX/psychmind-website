"use client";

import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { checks, PrivacyPreview, RequestPreview, SearchPreview } from "@/components/shared/product-preview";
import { CircleArrowIcon } from "@/components/ui/icons";
import { DoodleArrow, DoodleCircle, DoodleHookArrow } from "@/components/ui/doodles";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { VerifiedBadge } from "@/components/ui/tag";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { providerPhoto } from "@/lib/photos";

// "Discovery" as a bento box: the whole product loop in one view —
// search → verify → request → privacy → (back to search). Cards are laid out
// clockwise on desktop so the pencil arrows between them close the loop.
// Each card's preview plays when it scrolls into view and replays on hover.

/** Mount-on-view counter: 0 until first seen, then increments on each replay. */
function usePlayOnView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [run, setRun] = useState(0);
  const last = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setRun((r) => (r === 0 ? 1 : r));
        last.current = Date.now();
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const replay = () => {
    // Don't restart a preview that's still mid-sequence.
    if (run === 0 || Date.now() - last.current < 3500) return;
    last.current = Date.now();
    setRun((r) => r + 1);
  };
  return { ref, run, replay };
}

type CardProps = {
  step: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  visual: (run: number) => ReactNode;
  dark?: boolean;
  className?: string;
  visualClassName?: string;
};

function LoopCard({ step, title, body, href, cta, visual, dark, className, visualClassName }: CardProps) {
  const { ref, run, replay } = usePlayOnView<HTMLElement>();
  return (
    <article
      ref={ref}
      data-card
      onMouseEnter={replay}
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-[28px] border shadow-card will-change-transform",
        dark ? "grain border-warm-800 bg-warm-950 text-warm-25" : "border-warm-200 bg-white",
        className,
      )}
    >
      <div className={cn("relative m-2 overflow-hidden rounded-[22px]", visualClassName)}>{visual(run)}</div>
      <div className="flex items-end justify-between gap-6 px-6 pt-3 pb-6 sm:px-8 sm:pb-8">
        <div className="flex max-w-[440px] flex-col gap-2">
          <p className={cn("font-display text-lg italic", dark ? "text-brand-primary brightness-150" : "text-brand-primary")}>
            {step}
          </p>
          <h3 className={cn("type-h3 font-display-alt!", dark ? "text-warm-25" : "text-text-primary")}>{title}</h3>
          <p className={cn("type-body", dark ? "text-warm-300" : "text-text-tertiary")}>{body}</p>
        </div>
        <Link
          href={href}
          aria-label={cta}
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full transition-[background-color,color,scale] duration-300 ease-out-soft hover:scale-105",
            dark
              ? "bg-white/10 text-white hover:bg-white hover:text-warm-900"
              : "bg-warm-100 text-warm-800 hover:bg-warm-900 hover:text-white",
          )}
        >
          <CircleArrowIcon className="size-6 transition-[rotate] duration-300 group-hover/card:rotate-45" />
        </Link>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ visuals */

function SearchVisual({ run }: { run: number }) {
  // A whole sheet of lined paper laid on the card and taped along its top
  // edge — nothing clipped by the card's corners: one full result, then a
  // "more providers match" row instead of a half-visible card.
  return (
    <div className="relative h-full bg-warm-100 p-3.5 sm:p-4">
      <div className="paper-bg relative h-full rounded-[16px] shadow-card ring-1 ring-black/[0.04]">
        <span aria-hidden className="absolute -top-2.5 left-10 z-10 h-6 w-24 -rotate-[5deg] bg-tape-rose/90 shadow-[0_1px_2px_rgb(28_25_23/0.06)]" />
        <span aria-hidden className="absolute -top-2.5 right-12 z-10 h-6 w-20 rotate-[7deg] bg-tape-rose/90 shadow-[0_1px_2px_rgb(28_25_23/0.06)]" />
        <div className="absolute inset-0 overflow-hidden rounded-[16px] px-4 pt-6 pb-4 sm:px-6 sm:pt-7">
          {run > 0 && <SearchPreview key={run} limit={1} />}
        </div>
      </div>
    </div>
  );
}

function CredentialTicker({ run }: { run: number }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!run) return;
    const reset = setTimeout(() => setDone(0), 0);
    const timers = [0, 1, 2].map((i) => setTimeout(() => setDone(i + 1), 700 + i * 480));
    return () => {
      clearTimeout(reset);
      timers.forEach(clearTimeout);
    };
  }, [run]);
  return (
    <ul className="flex flex-col">
      {checks.slice(0, 3).map((c, i) => {
        const ok = i < done;
        return (
          <li key={c.label} className="flex items-center justify-between gap-4 border-t border-warm-100 py-1.5 first:border-t-0">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full transition-all duration-300",
                  ok ? "bg-warm-900 text-white" : "border border-dashed border-warm-300",
                )}
              >
                {ok && (
                  <svg viewBox="0 0 12 12" className="size-2.5 animate-pop-in" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2.5 6.2 5 8.5l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-[10px] font-medium tracking-[0.06em] text-text-tertiary uppercase">{c.label}</span>
            </span>
            <span className={cn("text-[11px] transition-colors duration-300", ok ? "text-text-primary" : "text-text-placeholder")}>
              {ok ? c.value : "Checking…"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function VerifiedVisual({ run }: { run: number }) {
  return (
    <div className="relative h-full bg-warm-100">
      <div data-parallax className="absolute -inset-y-[8%] inset-x-0">
        <Image
          src={providerPhoto("sara", 900)}
          alt="Sara Oliisi, a counselor on PsychMind"
          fill
          sizes="(min-width: 1024px) 500px, 100vw"
          className="object-cover object-[50%_20%]"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-warm-950/45 to-transparent" />

      {/* Floating product fragments */}
      <div data-float="-18" className="absolute top-5 right-5">
        <span className="relative block">
          <span className="block rounded-lg bg-white/95 p-1 shadow-raised backdrop-blur">
            <VerifiedBadge />
          </span>
          <span className="pointer-events-none absolute -inset-x-5 -inset-y-4 text-brand-primary" data-doodle>
            <DoodleCircle className="size-full" />
          </span>
        </span>
      </div>
      <div data-float="-40" className="absolute bottom-5 left-5 w-[min(260px,calc(100%-40px))] rounded-2xl border border-white/60 bg-white/95 p-3 shadow-raised backdrop-blur">
        <p className="pb-1.5 text-xs font-medium text-text-primary">Credentials &amp; qualifications</p>
        <CredentialTicker run={run} />
      </div>
      <div data-float="-26" className="absolute top-5 left-5 rounded-pill bg-warm-950/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
        Sara Oliisi · LMHC
      </div>
    </div>
  );
}

function RequestVisual({ run }: { run: number }) {
  return (
    <div className="grain relative flex h-full items-center justify-center bg-brand-soft p-5 sm:p-8">
      <div className="w-full max-w-[400px]">{run > 0 && <RequestPreview key={run} every={1900} loop={false} />}</div>
    </div>
  );
}

function PrivacyVisual({ run }: { run: number }) {
  return (
    <div className="relative flex h-full items-center justify-center bg-white/[0.03] p-5 ring-1 ring-white/10 ring-inset sm:p-8">
      <div className="w-full max-w-[400px]">{run > 0 && <PrivacyPreview key={run} />}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- section */

export function ProductLoop() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const cards = q<HTMLElement>("[data-card]");

        // Cards are dealt onto the desk: rise, settle from a slight tilt.
        gsap.from(cards, {
          y: 90,
          rotation: (i) => [-2.5, 2, -1.5, 2.5][i] ?? 0,
          autoAlpha: 0,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: "top 78%", once: true },
        });

        // The pencil draws the loop as you scroll through the grid.
        gsap.from(q("[data-loop] [data-draw]"), {
          drawSVG: 0,
          ease: "none",
          stagger: 0.25,
          scrollTrigger: { trigger: root.current, start: "top 55%", end: "bottom 75%", scrub: 0.6 },
        });
        gsap.from(q("[data-loop-note]"), {
          autoAlpha: 0,
          y: 10,
          scrollTrigger: { trigger: root.current, start: "center 60%", once: true },
        });
        gsap.from(q("[data-doodle] [data-draw]"), {
          drawSVG: 0,
          duration: 1.1,
          ease: "power2.inOut",
          delay: 0.6,
          scrollTrigger: { trigger: root.current, start: "top 60%", once: true },
        });

        // Depth: the portrait drifts slower than the UI fragments floating on it.
        q<HTMLElement>("[data-parallax]").forEach((el) =>
          gsap.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } }),
        );
        q<HTMLElement>("[data-float]").forEach((el) =>
          gsap.fromTo(
            el,
            { y: 0 },
            { y: Number(el.dataset.float), ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
          ),
        );
      });

      // A barely-there tilt that follows the cursor, on devices that hover.
      mm.add(`${MOTION_OK} and (hover: hover)`, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-card]", root.current);
        const cleanups = cards.map((card) => {
          gsap.set(card, { transformPerspective: 1200 });
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
          const move = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 3);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 3);
          };
          const leave = () => {
            rx(0);
            ry(0);
          };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          return () => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
          };
        });
        return () => cleanups.forEach((fn) => fn());
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
        />
      </Container>

      <Container size="wide" className="mt-10 sm:mt-14">
        <div ref={root} className="relative grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-2">
          <LoopCard
            step="01 — Search"
            title="Smart search"
            body="Find providers by specialty, approach, language, gender, and price range."
            href="/providers"
            cta="Browse providers"
            className="lg:col-span-7"
            visualClassName="h-[390px] sm:h-[440px]"
            visual={(run) => <SearchVisual run={run} />}
          />
          <LoopCard
            step="02 — Verify"
            title="Verified profiles"
            body="Every credential is manually checked by our team before a provider ever appears in a search."
            href="/how-it-works"
            cta="See how verification works"
            className="lg:col-span-5"
            visualClassName="h-[390px] sm:h-[440px]"
            visual={(run) => <VerifiedVisual run={run} />}
          />
          <LoopCard
            step="03 — Request"
            title="Book in seconds"
            body="Message a provider, pick a time that works for you, and you're set — no phone tag, no waitlists."
            href="/providers"
            cta="Start your search"
            className="lg:col-span-7 lg:col-start-6 lg:row-start-2"
            visualClassName="h-[360px] sm:h-[400px]"
            visual={(run) => <RequestVisual run={run} />}
          />
          <LoopCard
            step="04 — Stay private"
            title="Complete confidentiality"
            body="Your information is never shared or sold. Messages with a provider stay between you and them."
            href="/how-it-works"
            cta="See how we protect your privacy"
            dark
            className="lg:col-span-5 lg:col-start-1 lg:row-start-2"
            visualClassName="h-[360px] sm:h-[400px]"
            visual={(run) => <PrivacyVisual run={run} />}
          />

          {/* The loop, in pencil (desktop only): 01 → 02 → 03 → 04 → back to 01. */}
          <div data-loop aria-hidden className="pointer-events-none absolute inset-0 z-20 hidden text-warm-600 lg:block">
            <DoodleArrow className="absolute top-[18%] left-[calc(58.333%-44px)] w-[88px]" />
            <DoodleHookArrow className="absolute top-[calc(50%-46px)] left-[calc(79%-24px)] h-[92px] w-12 -scale-x-100" />
            <DoodleArrow className="absolute top-[74%] left-[calc(41.667%-44px)] w-[88px] -scale-x-100" />
            <DoodleHookArrow className="absolute top-[calc(50%-46px)] left-[calc(21%-24px)] h-[92px] w-12 rotate-180" />
          </div>
          <p
            data-loop-note
            className="pointer-events-none absolute top-[calc(50%-12px)] left-[calc(21%+34px)] z-20 hidden font-display text-[15px] text-warm-600 italic lg:block"
          >
            switch providers any time
          </p>
        </div>
      </Container>

      <Reveal className="mt-12 sm:mt-16">
        <p className="mx-auto max-w-[462px] text-center type-quote-sm text-text-tertiary">
          &ldquo;PsychMind makes it simple to find the right professional&rdquo; — no referrals, no
          waitlists, no awkward phone calls.
        </p>
      </Reveal>
    </Section>
  );
}
