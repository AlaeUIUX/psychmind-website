"use client";

import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { DoodleArrow } from "@/components/ui/doodles";
import { ChartColumnIcon, CtaArrowIcon, EyeOffIcon, MessageSquareLockIcon, TwoFactorIcon } from "@/components/ui/hugeicons";
import { Container, Section } from "@/components/ui/section";
import { VerifiedBadge } from "@/components/ui/tag";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { privacyIntro, privacyPromises as promises } from "@/components/shared/trust-content";
import { providerPhotoSource } from "@/lib/photos";
import { SectionHeader } from "@/components/ui/section-header";
import { Lock, STILL_REDUCED, useStep } from "./bento-previews";
import { PrivacyGlobe } from "./privacy-globe";
import { topicChip, topicChipIdle } from "./search-styles";

// Real people, carefully verified: three provider polaroids taped to the page,
// centred, and the privacy promise in plain words. It opens as every section
// does (SectionHeader), and the polaroids' captions use the bento's type and
// chips: a 14px name over a 12px line, the bar's chips.
// Providers are the sample profiles from the Figma file.
// TODO(client): swap in live providers + confirm verification/privacy copy.

const providers = [
  {
    name: "Shatiria Johnson",
    title: "Psychiatrist, M.D.",
    photo: providerPhotoSource("shatiria", 520),
    tags: ["Anxiety", "Mood"],
    tape: "bg-tape-lilac/90 rotate-[4deg]",
  },
  {
    name: "Sara Oliisi",
    title: "Counselor, LMHC, M.S., B.S.",
    photo: providerPhotoSource("sara", 520),
    tags: ["Trauma", "Mindfulness"],
    tape: "bg-tape-rose/90 -rotate-[3deg]",
  },
  {
    name: "Monica Rios",
    title: "Licensed Professional Counselor",
    photo: providerPhotoSource("monica", 520),
    tags: ["Self-esteem", "Teens"],
    tape: "bg-review-mint rotate-[2deg]",
  },
];

// Resting fan on desktop (x offset in px, rotation in deg); they start stacked.
const FAN = [
  { x: -206, y: 26, r: -7 },
  { x: 0, y: -8, r: 1.5 },
  { x: 206, y: 30, r: 6 },
];

// As in the bento's Complete confidentiality card: the lock shuts as the card comes in.
const PROMISE_AT = [200];
// Each promise's icon, in privacyPromises' order: no one watching, daily counts, a
// request under lock, two-step login.
const PROMISE_ICONS = [EyeOffIcon, ChartColumnIcon, MessageSquareLockIcon, TwoFactorIcon];

/** The privacy promise, built as the bento's Complete confidentiality card is:
 *  a head (the lock as its lead, then the title), a hairline, the promises
 *  under it, each with its icon, which slides in only as you hover it, and as
 *  the second column the girl's boat on top of her planet of sea
 *  (privacy-globe.tsx). The lock shuts as the card comes into view (and again
 *  each time it comes back after leaving the screen); reduced motion shows it shut.
 *  No shadow: it sits in its grey frame. Corners are concentric, each layer
 *  7px in (a 1px border and 6px): the frame's 20px, this card's 13px, the
 *  picture's 6px. */
function PrivacyPromise() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // plays once it's well in view; resets only when it's off the screen
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.4) setInView(true);
        else if (!e.isIntersecting) setInView(false);
      },
      { threshold: [0, 0.4] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const step = useStep(inView, PROMISE_AT, STILL_REDUCED);

  return (
    // halves on desktop: each promise still fits two lines, and the picture's
    // column is about as wide as the card is tall
    <div ref={ref} className="grid rounded-[13px] border border-warm-200 bg-white lg:grid-cols-2">
      {/* how we're different; under the hairline, how it's done */}
      <div className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
        <div className="flex items-center gap-3">
          <Lock shut={step >= 1} />
          <p className="text-[15px] leading-5 font-medium tracking-[-0.01em] text-warm-900">Our privacy promise</p>
        </div>
        {/* a line each; the promises at full ink, the rest at 60% (still AA on white) */}
        <p className="mt-3 text-sm leading-[22px] tracking-[-0.01em] text-balance text-warm-900/60">
          {privacyIntro.map((line) => (
            <span key={line[0].text} className="block">
              {line.map((s) => (s.strong ? <span key={s.text} className="text-warm-900">{s.text}</span> : s.text))}
            </span>
          ))}
        </p>
        <ul className="mt-4 border-t border-warm-200 pt-1">
          {promises.map((p, i) => {
            const Icon = PROMISE_ICONS[i];
            return (
              <li key={p.title} className="group/promise relative border-t border-warm-100 py-3 first:border-t-0">
                {/* No icon at rest, so the text sits flush; hovered, the icon fades in and the
                    text steps aside for it. The text always keeps that room free on its right,
                    so it slides without ever rewrapping. */}
                <Icon className="absolute top-3.5 left-0 size-4 -translate-x-1 text-warm-900 opacity-0 transition-[opacity,translate] duration-300 ease-out-soft group-hover/promise:translate-x-0 group-hover/promise:opacity-100 motion-reduce:transition-none" />
                <span className="flex flex-col gap-0.5 pr-7 tracking-[-0.01em] transition-[translate] duration-300 ease-out-soft group-hover/promise:translate-x-7 motion-reduce:transition-none">
                  <span className="text-sm leading-5 font-medium text-warm-900">{p.title}</span>
                  <span className="text-[13px] leading-[18px] text-warm-900/60">{p.body}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {/* The picture's own column, the card's full height; the animation in it
          is always square, centred on the grey it fades into. */}
      <div data-privacy-slot className="mx-1.5 mb-1.5 flex items-center overflow-hidden rounded-[6px] bg-warm-100 lg:m-1.5">
        <div className="relative aspect-square w-full">
          <PrivacyGlobe />
        </div>
      </div>
    </div>
  );
}

function Polaroid({ p, className }: { p: (typeof providers)[number]; className?: string }) {
  return (
    <figure
      className={cn(
        "relative w-[236px] shrink-0 rounded-[6px] bg-white p-3 pb-4 lg:w-[216px] shadow-raised ring-1 ring-black/[0.04] transition-[translate,scale,box-shadow] duration-500 ease-out-soft group-hover/pol:-translate-y-3 group-hover/pol:scale-[1.03] sm:w-[256px]",
        className,
      )}
    >
      <span aria-hidden className={cn("absolute -top-3 left-1/2 z-10 h-7 w-24 -translate-x-1/2", p.tape)} />
      <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-warm-100">
        <Image src={p.photo} alt={`${p.name}, ${p.title}`} fill sizes="260px" className="object-cover object-top" />
        <span className="absolute top-2 left-2">
          <VerifiedBadge size="sm" />
        </span>
      </div>
      <figcaption className="type-scope-sort flex flex-col gap-0.5 px-1 pt-3">
        <span className="text-sm leading-[18px] font-medium text-warm-900">{p.name}</span>
        <span className="text-xs leading-4 text-warm-500">{p.title}</span>
        <span className="flex gap-1.5 pt-2.5">
          {p.tags.map((t) => (
            <span key={t} className={cn(topicChip, topicChipIdle)}>
              {t}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}

export function VerifiedProviders() {
  const stage = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);

  // Below lg the polaroids sit in a horizontal, snap-scrolling row: swipe on
  // touch, drag with a mouse, or tap a dot.
  const drag = useRef<{ x: number; left: number } | null>(null);
  const dragged = useRef(false);
  const cardStep = () => {
    const el = stage.current;
    const first = el?.querySelector<HTMLElement>("[data-polaroid]");
    return first ? first.offsetWidth + 20 : 1;
  };
  const onStageScroll = () => {
    const el = stage.current;
    if (el) setSlide(Math.min(providers.length - 1, Math.round(el.scrollLeft / cardStep())));
  };
  const scrollToCard = (i: number) => stage.current?.scrollTo({ left: i * cardStep(), behavior: "smooth" });
  const onDragStart = (e: PointerEvent<HTMLDivElement>) => {
    const el = stage.current;
    if (!el || e.pointerType !== "mouse" || e.button !== 0 || el.scrollWidth <= el.clientWidth) return;
    drag.current = { x: e.clientX, left: el.scrollLeft };
    dragged.current = false;
    el.style.scrollSnapType = "none";
  };
  const onDragMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = stage.current;
    if (!el || !drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) dragged.current = true;
    el.scrollLeft = drag.current.left - dx;
  };
  const onDragEnd = () => {
    const el = stage.current;
    if (!el || !drag.current) return;
    drag.current = null;
    // settle onto the nearest card, then hand snapping back to CSS
    const target = Math.round(el.scrollLeft / cardStep()) * cardStep();
    el.scrollTo({ left: target, behavior: "smooth" });
    setTimeout(() => {
      el.style.scrollSnapType = "";
      dragged.current = false;
    }, 400);
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop: the three polaroids start stacked and fan out across the table.
      mm.add(`${MOTION_OK} and (min-width: 1024px)`, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-polaroid]", stage.current);
        gsap.fromTo(
          cards,
          { x: 0, y: 40, rotation: (i) => [-3, 2, 5][i] },
          {
            x: (i) => FAN[i].x,
            y: (i) => FAN[i].y,
            rotation: (i) => FAN[i].r,
            ease: "power2.out",
            scrollTrigger: { trigger: stage.current, start: "top 85%", end: "center 55%", scrub: 0.8 },
          },
        );
      });
      mm.add(`${MOTION_OK} and (max-width: 1023px)`, () => {
        gsap.from(gsap.utils.toArray("[data-polaroid]", stage.current), {
          y: 60,
          autoAlpha: 0,
          rotation: 4,
          stagger: 0.1,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: stage.current, start: "top 85%", once: true },
        });
      });

      // The pencil arrow draws in beside the button.
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        gsap.from(q("[data-more] [data-draw]"), {
          drawSVG: 0,
          duration: 0.9,
          ease: "power2.inOut",
          scrollTrigger: { trigger: q("[data-more]")[0], start: "top 90%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section spacing="lg" className="overflow-x-clip">
      <Container ref={root} className="flex flex-col gap-10 sm:gap-12">
        <SectionHeader
          align="center"
          badge={{ icon: "/images/how-it-works/profiles-badge-icon.svg", label: "Verified providers" }}
          title="Real people, carefully verified"
          // TODO(client): the owner's shorter line (2026-10-27), replacing
          // "…checked by our team before they appear in a search."
          subtitle="Every provider on PsychMind is an independent professional, and every credential is checked by our team."
        />

        {/* The three providers, centred: stacked as one, they fan out as the
            section scrolls in (side by side, and swiped, below lg). */}
        <div>
          <div>
            <div
              ref={stage}
              onScroll={onStageScroll}
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              onClickCapture={(e) => {
                // a drag shouldn't also count as a click on a card
                if (dragged.current) e.preventDefault();
              }}
              className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto overscroll-x-contain px-4 pt-6 pb-16 select-none sm:-mx-8 sm:scroll-px-8 sm:px-8 max-lg:cursor-grab max-lg:active:cursor-grabbing lg:relative lg:mx-0 lg:h-[560px] lg:overflow-visible lg:p-0"
            >
              {providers.map((p, i) => (
                <div
                  key={p.name}
                  data-polaroid
                  className={cn(
                    "group/pol shrink-0 snap-start lg:absolute lg:top-[40px] lg:left-[calc(50%-108px)]",
                    i === 1 ? "lg:z-20" : "lg:z-10",
                    "hover:z-30",
                  )}
                >
                  <Polaroid p={p} />
                </div>
              ))}
            </div>

            {/* Phones & tablets: where you are in the row, plus a pencil nudge to swipe. */}
            {/* -mt-10 takes back the extra room the row leaves under the cards for their shadows */}
            <div className="-mt-10 mb-6 flex items-center justify-center gap-4 lg:hidden">
              <div className="flex items-center gap-1.5">
                {providers.map((p, i) => (
                  <button
                    key={p.name}
                    type="button"
                    aria-label={`Show ${p.name}`}
                    onClick={() => scrollToCard(i)}
                    className="flex h-6 items-center px-0.5"
                  >
                    <span
                      className={cn(
                        "block h-1.5 rounded-full transition-all duration-500 ease-out-soft",
                        i === slide ? "w-5 bg-warm-900" : "w-1.5 bg-warm-300",
                      )}
                    />
                  </button>
                ))}
              </div>
              <span aria-hidden className="flex items-center gap-1 font-display text-[15px] text-warm-600 italic">
                swipe
                <DoodleArrow className="w-9" />
              </span>
            </div>
            <div data-more className="flex items-center justify-center gap-3 lg:-mt-6">
              <span className="hidden text-warm-600 sm:block">
                <DoodleArrow className="w-16 -scale-y-100" />
              </span>
              <Button asChild variant="secondary" size="md">
                <Link href="/providers">
                  Meet 2,400+ verified providers
                  <CtaArrowIcon />
                </Link>
              </Button>
            </div>
          </div>

        </div>

        {/* The privacy promise, in the bento's grey: a thin grey frame around
            one white card, its picture in the second column (2026-10-27). Four
            fifths of the section's width on tablets; the section's full width on
            desktop, where the picture's column needs the room (half the card,
            1.5× its width at four fifths), and on phones. */}
        <Reveal delay={120} className="rounded-card border border-warm-200 bg-warm-100 p-1.5 sm:w-4/5 sm:self-center lg:w-full">
          <PrivacyPromise />
        </Reveal>
      </Container>
    </Section>
  );
}
