"use client";

import { cn } from "cn";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { Reveal } from "@/components/reveal";
import { PrivacyPreview, RequestPreview, SearchPreview, VerifiedPreview } from "@/components/shared/product-preview";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon, SearchIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

type Tab = {
  id: string;
  label: string;
  title: string;
  description: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaIcon: "search" | "arrow";
  Preview: () => ReactElement;
};

const tabs: Tab[] = [
  {
    id: "search",
    label: "Smart search",
    title: "Smart search",
    description: [
      "Find providers by specialty, approach, language, gender, and price range.",
      "Search is tailored to what matters to you.",
    ],
    ctaLabel: "Browse providers",
    ctaHref: "/providers",
    ctaIcon: "search",
    Preview: () => <SearchPreview />,
  },
  {
    id: "verified",
    label: "Verified profiles",
    title: "Verified profiles",
    description: [
      "Every credential is manually checked by our team before a provider ever appears in a search.",
      "You always know exactly who you're reaching out to.",
    ],
    ctaLabel: "See how it works",
    ctaHref: "/how-it-works",
    ctaIcon: "arrow",
    Preview: VerifiedPreview,
  },
  {
    id: "booking",
    label: "Book in seconds",
    title: "Book in seconds",
    description: [
      "Message a provider, pick a time that works for you, and you're set — no phone tag, no waitlists.",
      "Your first session is a conversation, not a commitment.",
    ],
    ctaLabel: "Start your search",
    ctaHref: "/providers",
    ctaIcon: "arrow",
    Preview: () => <RequestPreview />,
  },
  {
    id: "confidential",
    label: "Complete confidentiality",
    title: "Complete confidentiality",
    description: [
      "Your information is never shared or sold. Messages with a provider stay between you and them.",
      "Browse and reach out with your privacy fully intact.",
    ],
    ctaLabel: "See how it works",
    ctaHref: "/how-it-works",
    ctaIcon: "arrow",
    Preview: PrivacyPreview,
  },
];

/** How long each tab stays up while auto-playing. */
const TAB_MS = 8000;

export function SmartSearchFeature() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Only auto-advance while the feature is actually on screen, and never
  // for people who prefer reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setAutoplay(false), 0);
      return () => clearTimeout(t);
    }
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Keep the active tab visible in the horizontally-scrolling row on phones.
  useEffect(() => {
    const list = tablistRef.current;
    const tab = tabRefs.current[active];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: tab.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  const running = autoplay && inView && !hovered;

  function select(index: number) {
    setActive(index);
    // A deliberate choice stops the slideshow so it doesn't move out from under the reader.
    setAutoplay(false);
  }

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + tabs.length) % tabs.length;
    tabRefs.current[next]?.focus();
    select(next);
  }

  const tab = tabs[active];
  const Icon = tab.ctaIcon === "search" ? SearchIcon : CircleArrowIcon;

  return (
    <Section>
      <Container className="flex flex-col gap-10 sm:gap-12">
        <SectionHeader
          align="center"
          badge={{ icon: "/images/home/discovery-icon-32.svg", label: "Discovery" }}
          title="Everything you need to begin your journey"
        />
      </Container>

      {/* Wider than the content column on purpose (Figma: 1440px frame), but
          still capped so it doesn't stretch on ultra-wide monitors. */}
      <Reveal className="mt-8 sm:mt-10">
        <Container size="wide" className="flex flex-col gap-6">
          <div
            ref={tablistRef}
            role="tablist"
            aria-label="PsychMind features"
            className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 sm:mx-0 sm:justify-center sm:gap-10 sm:px-0 md:gap-14"
          >
            {tabs.map((t, i) => {
              const selected = i === active;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`feature-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls="feature-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(i)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={cn(
                    "relative shrink-0 whitespace-nowrap pt-2 pb-3 font-display text-lg tracking-[-0.01em] transition-colors duration-300 sm:text-display-xs",
                    selected ? "text-warm-950" : "text-warm-600 hover:text-warm-800",
                  )}
                >
                  {t.label}
                  {/* Underline: a faint track, filled left → right while the tab is on the clock. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 bottom-1 h-px origin-left overflow-hidden bg-warm-300 transition-transform duration-500 ease-out-soft",
                      selected ? "scale-x-100" : "scale-x-0",
                    )}
                  >
                    {selected && (
                      <span
                        key={`${active}-${autoplay}`}
                        onAnimationEnd={() => autoplay && setActive((a) => (a + 1) % tabs.length)}
                        className="block h-full origin-left bg-warm-950"
                        style={
                          autoplay
                            ? {
                                animation: `progress-fill ${TAB_MS}ms linear both`,
                                animationPlayState: running ? "running" : "paused",
                              }
                            : undefined
                        }
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Faint lined-paper texture peeking behind a raised card, matches the Figma frame */}
          <div
            ref={sectionRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="paper-bg relative w-full overflow-hidden rounded-card p-3 sm:p-6"
          >
            {/* washi-tape decorations */}
            <div
              className="absolute -top-6 -left-10 hidden h-12 w-40 bg-tape-rose md:block"
              style={{ transform: "rotate(129.6deg) scaleY(-1)" }}
            />
            <div
              className="absolute -top-6 -right-10 hidden h-12 w-40 bg-tape-rose md:block"
              style={{ transform: "rotate(50.4deg)" }}
            />

            <div
              id="feature-panel"
              role="tabpanel"
              aria-labelledby={`feature-tab-${tab.id}`}
              className="relative mx-auto flex w-full max-w-[1040px] flex-col gap-2.5 overflow-hidden rounded-field border border-warm-300 bg-warm-50 p-2.5 shadow-card md:flex-row"
            >
              <div key={tab.id} className="flex min-w-0 flex-1 flex-col justify-center gap-8 p-5 sm:p-8 md:max-w-[400px]">
                <div className="flex flex-col gap-4 sm:gap-5">
                  <h3 className="animate-rise-in type-h3 font-display-alt! text-text-primary">{tab.title}</h3>
                  <div className="flex max-w-[371px] flex-col gap-4 type-body-lg text-text-tertiary sm:type-lead">
                    {tab.description.map((line, i) => (
                      <p key={line} className="animate-rise-in" style={{ animationDelay: `${80 + i * 80}ms` }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="animate-rise-in" style={{ animationDelay: "240ms" }}>
                  <Button asChild size="lg">
                    <a href={tab.ctaHref}>
                      {tab.ctaIcon === "search" && <Icon />}
                      {tab.ctaLabel}
                      {tab.ctaIcon === "arrow" && <Icon />}
                    </a>
                  </Button>
                </div>
              </div>

              {/* Product preview, flush against the card's own edges */}
              {/* Fixed height so switching tabs never makes the page jump. */}
              <div className="relative flex h-[440px] min-w-0 flex-1 flex-col overflow-hidden rounded-tag bg-warm-100 p-3 sm:h-[520px] sm:p-5 md:h-[560px]">
                <div key={tab.id} className="flex flex-1 flex-col justify-center-safe">
                  <tab.Preview />
                </div>
                {/* Fades anything past the panel's height instead of a hard cut. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-warm-100" />
              </div>
            </div>
          </div>
        </Container>
      </Reveal>

      <Reveal className="mt-10 sm:mt-12">
        <p className="mx-auto max-w-[462px] text-center type-quote-sm text-text-tertiary">
          &ldquo;PsychMind makes it simple to find the right professional&rdquo; — no referrals, no
          waitlists, no awkward phone calls.
        </p>
      </Reveal>
    </Section>
  );
}
