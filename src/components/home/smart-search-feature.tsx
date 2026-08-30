"use client";

import { animate } from "animejs";
import { useRef, useState, type ReactElement } from "react";

type EnterAnim = {
  translateY?: number;
  translateX?: number;
  scale?: number;
  duration: number;
  ease: string;
};

type Tab = {
  id: string;
  label: string;
  title: string;
  description: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaIcon: string;
  // Figma only designed the "Smart search" state — the other three panels
  // are original mockups in the same visual language, not 1:1 Figma pulls.
  enter: EnterAnim;
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
    ctaIcon: "/images/home/browse-providers-icon.svg",
    enter: { translateY: 16, duration: 480, ease: "outQuad" },
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
    ctaIcon: "/images/how-it-works/cta-arrow-icon.svg",
    enter: { scale: 0.92, duration: 420, ease: "outBack" },
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
    ctaIcon: "/images/how-it-works/cta-arrow-icon.svg",
    enter: { translateX: 28, duration: 380, ease: "outCubic" },
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
    ctaIcon: "/images/how-it-works/cta-arrow-icon.svg",
    enter: { duration: 620, ease: "outSine" },
  },
];

function SearchToolMockup() {
  return (
    <div className="rounded-4xl border border-warm-300 bg-warm-200 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 px-2 py-2 w-full min-w-0">
      <div className="rounded-4xl bg-warm-100 flex flex-col gap-3 p-4 shrink-0">
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="text-text-placeholder">In-person</span>
          <span className="text-text-primary">Online</span>
        </div>
        <div className="relative h-5 w-[70px] rounded-full bg-warm-200">
          <div className="absolute right-0 top-0 h-5 w-5 rounded-full bg-brand-primary" />
        </div>
      </div>
      <div className="rounded-4xl bg-warm-100 flex flex-col gap-1.5 p-4 flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">What&apos;s on your mind?</p>
        <p className="text-sm text-text-placeholder">
          I need help with <span className="font-medium text-text-primary">Anxiety</span>
        </p>
      </div>
      <button aria-label="Search" className="rounded-full bg-brand-primary p-3 shrink-0">
        <img src="/images/home/search-button-icon.svg" alt="" width={20} height={20} />
      </button>
    </div>
  );
}

function VerifiedProfileMockup() {
  return (
    <div className="rounded-4xl border border-warm-300 bg-warm-25 flex items-center gap-4 p-4 w-full max-w-[380px]">
      <div className="relative size-14 shrink-0 rounded-2xl border border-black/[0.08] bg-white overflow-hidden">
        <img src="/images/how-it-works/profile-avatar.png" alt="" className="size-full object-cover" />
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-md font-semibold text-text-primary truncate">Sara Oliisi</p>
          <span className="inline-flex items-center gap-1 rounded-md border border-warm-300 bg-white px-2 py-0.5 text-xs font-medium text-text-secondary shrink-0">
            <img src="/images/how-it-works/verified-check-icon.svg" alt="" width={12} height={12} />
            Verified
          </span>
        </div>
        <p className="text-sm text-text-secondary truncate">Counselor, LMHC, M.S., B.S.</p>
      </div>
    </div>
  );
}

function BookingMockup() {
  return (
    <div className="rounded-4xl border border-warm-300 bg-warm-25 flex items-center gap-4 p-4 w-full max-w-[380px]">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
        <img src="/images/how-it-works/check-icon.svg" alt="" width={20} height={20} />
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-md font-semibold text-text-primary">Session confirmed</p>
        <p className="text-sm text-text-secondary truncate">Thursday · 4:00 PM · Online</p>
      </div>
    </div>
  );
}

function ConfidentialityMockup() {
  return (
    <div className="rounded-4xl border border-warm-300 bg-warm-25 flex items-center gap-4 p-4 w-full max-w-[380px]">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
        <img src="/images/how-it-works/shield-icon.svg" alt="" width={20} height={20} />
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-md font-semibold text-text-primary">Your info is never shared</p>
        <p className="text-sm text-text-secondary truncate">End-to-end confidential messaging</p>
      </div>
    </div>
  );
}

const mockups: Record<string, () => ReactElement> = {
  search: SearchToolMockup,
  verified: VerifiedProfileMockup,
  booking: BookingMockup,
  confidential: ConfidentialityMockup,
};

export function SmartSearchFeature() {
  const [active, setActive] = useState(0);
  const busy = useRef(false);
  const leftRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  function selectTab(index: number) {
    if (busy.current || index === active) return;
    busy.current = true;
    const leftEl = leftRef.current;
    const boxEl = boxRef.current;

    const fadeOut = [leftEl, boxEl]
      .filter((el): el is HTMLDivElement => Boolean(el))
      .map((el) => animate(el, { opacity: 0, duration: 150, ease: "inQuad" }).then());

    Promise.all(fadeOut).then(() => {
      setActive(index);
      requestAnimationFrame(() => {
        const tab = tabs[index];
        if (leftEl) {
          leftEl.style.opacity = "0";
          animate(leftEl, { opacity: 1, translateY: [12, 0], duration: 380, ease: "outQuad" });
        }
        if (boxEl) {
          boxEl.style.opacity = "0";
          const { translateY, translateX, scale, duration, ease } = tab.enter;
          animate(boxEl, {
            opacity: 1,
            ...(translateY != null && { translateY: [translateY, 0] }),
            ...(translateX != null && { translateX: [translateX, 0] }),
            ...(scale != null && { scale: [scale, 1] }),
            duration,
            ease,
          }).then(() => {
            busy.current = false;
          });
        } else {
          busy.current = false;
        }
      });
    });
  }

  const tab = tabs[active];
  const Mockup = mockups[tab.id];

  return (
    <section className="w-full flex flex-col items-center gap-12 px-4 sm:px-12 md:px-20 py-12">
      <div className="flex flex-col items-center gap-6 w-full max-w-[1052px]">
        <span className="inline-flex items-center gap-3 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-[18px] py-2 text-lg font-medium">
          <img src="/images/home/discovery-icon-32.svg" alt="" width={32} height={32} />
          <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
            Discovery
          </span>
        </span>
        <h2 className="font-display text-warm-900 text-display-md tracking-[-0.46px] text-center">
          Everything you need to begin your journey
        </h2>
      </div>

      {/* Figma has this card at 1440px vs. the 1052px heading above it — noticeably
          wider than the rest of the page's content column, not capped the same way. */}
      <div className="w-full flex flex-col gap-5">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 md:flex-nowrap md:justify-center md:gap-[68px] font-display text-lg sm:text-display-xs whitespace-nowrap">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              onClick={() => selectTab(i)}
              className={i === active ? "underline text-warm-950" : "text-warm-600 hover:text-warm-800 transition-colors"}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Feature card: faint lined-paper texture peeking behind a raised card, matches the Figma frame 1:1 */}
        <div className="paper-bg relative w-full rounded-[10px] overflow-hidden p-4 sm:p-6">
          {/* pink washi-tape decorations */}
          <div
            className="hidden md:block absolute -top-6 -left-10 w-40 h-12 bg-[#ffd9dc]"
            style={{ transform: "rotate(129.6deg) scaleY(-1)" }}
          />
          <div
            className="hidden md:block absolute -top-6 -right-10 w-40 h-12 bg-[#ffd9dc]"
            style={{ transform: "rotate(50.4deg)" }}
          />

          <div className="relative rounded-xl border border-warm-300 bg-warm-50 flex flex-col md:flex-row gap-2.5 p-2.5 overflow-hidden">
            <div
              ref={leftRef}
              className="flex flex-col justify-center gap-10 sm:gap-16 lg:gap-24 flex-1 min-w-0 md:max-w-[400px] p-6 sm:p-9 lg:p-16"
            >
              <div className="flex flex-col gap-6">
                <h3 className="font-display-alt text-display-md text-text-primary">{tab.title}</h3>
                <p className="text-lg sm:text-display-xs text-text-placeholder max-w-[371px]">
                  {tab.description.map((line, i) => (
                    <span key={i}>
                      {i > 0 && (
                        <>
                          <br />
                          <br />
                        </>
                      )}
                      {line}
                    </span>
                  ))}
                </p>
              </div>
              <a
                href={tab.ctaHref}
                className="inline-flex w-fit items-center gap-3 rounded-pill bg-warm-800 px-6 py-3 text-xl font-medium text-white hover:bg-warm-900 transition-colors"
              >
                <img src={tab.ctaIcon} alt="" width={24} height={24} />
                {tab.ctaLabel}
              </a>
            </div>

            {/* Full-bleed panel: flush against the left content and the card's own top/right/bottom edges, no gap or independent rounding */}
            <div className="flex-1 min-w-0 bg-warm-100 rounded-lg relative min-h-[420px] lg:min-h-[560px] p-6 flex flex-col gap-6">
              <div ref={boxRef} style={{ opacity: 1 }}>
                <Mockup />
              </div>
              <div className="flex-1 rounded-[24px] bg-warm-25 border border-dashed border-warm-300" />
            </div>
          </div>
        </div>
      </div>

      <p className="font-display text-text-tertiary text-lg text-center tracking-[-0.46px] max-w-[462px]">
        &ldquo;PsychMind makes it simple to find the right professional&rdquo; — no referrals, no
        waitlists, no awkward phone calls.
      </p>
    </section>
  );
}
