"use client";

import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { DoodleArrow, DoodleCheck } from "@/components/ui/doodles";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Tag, VerifiedBadge } from "@/components/ui/tag";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { privacyPromises as promises, verifySteps as steps } from "@/components/shared/trust-content";
import { providerPhoto } from "@/lib/photos";

// Real people, carefully verified: provider polaroids taped to the page,
// how verification works, and the privacy promise in plain words.
// Providers are the sample profiles from the Figma file.
// TODO(client): swap in live providers + confirm verification/privacy copy.

const providers = [
  {
    name: "Shatiria Johnson",
    title: "Psychiatrist, M.D.",
    photo: providerPhoto("shatiria", 520),
    tags: ["Anxiety", "Mood"],
    tape: "bg-tape-lilac/90 rotate-[4deg]",
  },
  {
    name: "Sara Oliisi",
    title: "Counselor, LMHC, M.S., B.S.",
    photo: providerPhoto("sara", 520),
    tags: ["Trauma", "Mindfulness"],
    tape: "bg-tape-rose/90 -rotate-[3deg]",
  },
  {
    name: "Monica Rios",
    title: "Licensed Professional Counselor",
    photo: providerPhoto("monica", 520),
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
        <span className="absolute top-2 left-2 rounded-lg bg-white/95 p-0.5 shadow-control">
          <VerifiedBadge size="sm" />
        </span>
      </div>
      <figcaption className="flex flex-col gap-1.5 px-1 pt-3">
        <span className="font-display text-xl leading-6 text-text-primary">{p.name}</span>
        <span className="flex items-center gap-1.5 text-xs text-text-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/how-it-works/check-icon.svg" alt="" className="size-3" />
          {p.title}
        </span>
        <span className="flex gap-1 pt-1">
          {p.tags.map((t) => (
            <Tag key={t} className="px-2 py-0.5 text-xs">
              {t}
            </Tag>
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

      // Pencil ticks draw in beside each verification step.
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        gsap.from(q("[data-tick] [data-draw]"), {
          drawSVG: 0,
          duration: 0.6,
          ease: "power2.inOut",
          stagger: 0.35,
          scrollTrigger: { trigger: q("[data-steps]")[0], start: "top 75%", once: true },
        });
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
      <Container ref={root} className="flex flex-col gap-12 sm:gap-16">
        <SectionHeader
          badge={{ icon: "/images/how-it-works/profiles-badge-icon.svg", label: "Verified providers" }}
          title="Real people, carefully verified"
          subtitle="Every provider on PsychMind is an independent professional — and every credential is checked by our team before they appear in a search."
        />

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Polaroids */}
          <div className="order-first lg:order-last lg:col-span-7">
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
              className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto overscroll-x-contain px-4 pt-6 pb-8 select-none sm:-mx-8 sm:scroll-px-8 sm:px-8 max-lg:cursor-grab max-lg:active:cursor-grabbing lg:relative lg:mx-0 lg:h-[560px] lg:overflow-visible lg:p-0"
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
            <div className="-mt-2 mb-6 flex items-center justify-center gap-4 lg:hidden">
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
                  <CircleArrowIcon />
                </Link>
              </Button>
            </div>
          </div>

          {/* How we verify + privacy promise */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Reveal className="paper-bg relative rounded-card p-6 shadow-card sm:p-8">
              <span aria-hidden className="absolute -top-3 right-10 h-7 w-20 rotate-[6deg] bg-tape-rose/90" />
              <h3 className="type-h4 text-text-primary">How we verify</h3>
              <ol data-steps className="mt-5 flex flex-col gap-5">
                {steps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-warm-300 bg-warm-25 font-display text-md text-warm-900">
                      {i + 1}
                      <span data-tick className="absolute -top-2 -right-3 w-6 text-brand-primary">
                        <DoodleCheck className="w-full" />
                      </span>
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="type-body font-semibold text-text-primary">{s.title}</p>
                      <p className="type-small text-text-tertiary">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={120} className="grain rounded-card bg-warm-950 p-6 text-warm-25 shadow-card sm:p-8">
              <p className="flex items-center gap-2 type-small font-medium tracking-[0.06em] text-warm-300 uppercase">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                  <rect x="5.5" y="11" width="13" height="9" rx="2.5" fill="currentColor" stroke="none" />
                </svg>
                Our privacy promise
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {promises.map((line) => (
                  <li key={line} className="flex gap-3 type-body text-warm-100">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-primary" />
                    {line}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
