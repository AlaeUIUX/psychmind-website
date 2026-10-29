"use client";

import { cn } from "cn";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CtaArrowIcon, GlobeIcon, HeartIcon, MapPinIcon, MonitorIcon, SendIcon as LucideSendIcon } from "@/components/ui/hugeicons";
import { pill, topicChipIdle, topicChipOn } from "@/components/home/search-styles";
import { buttonVariants } from "@/components/ui/button";
import { SearchIcon, VerifiedSealIcon } from "@/components/ui/icons";
import { toggleVariants } from "@/components/ui/toggle";
import { formatLabel, sessionTypeLabel } from "@/lib/requests";
import { SessionModeSwitch } from "./session-mode-switch";
import { providerPhoto } from "@/lib/photos";

// Miniature, non-interactive versions of the real product screens from the
// Figma file (Search results 150:3859, Booking flow 194:14789) used to
// explain features on the marketing pages. Each preview plays its own short
// sequence when it mounts — remount it (change its `key`) to replay.
// Everything is aria-hidden: these are pictures of the product, not controls.
// Layout adapts to the preview's own width via container queries (@container).

const at = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Types `text` out one character at a time after `startMs`. */
function useTypewriter(text: string, startMs: number, perChar = 55) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reducedMotion()) {
      const t = setTimeout(() => setCount(text.length), 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) clearInterval(interval);
      }, perChar);
    }, startMs);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, startMs, perChar]);
  return text.slice(0, count);
}

/** Steps 0 → count-1 every `every` ms; loops, or stops on the last step. */
function useCycle(count: number, every: number, loop = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () =>
        setI((v) => {
          if (v + 1 < count) return v + 1;
          if (!loop) clearInterval(t);
          return loop ? 0 : v;
        }),
      every,
    );
    return () => clearInterval(t);
  }, [count, every, loop]);
  return i;
}

const providers = [
  {
    name: "Sara Oliisi",
    title: "Counselor, LMHC, M.S., B.S.",
    photo: providerPhoto("sara", 200, 1),
    about: "I often work with adults who feel stuck, overwhelmed, or disconnected from the life they want to be living.",
    tags: ["Trauma", "Anxiety", "Mindfulness"],
    price: "120",
  },
  {
    name: "Shatiria Johnson",
    title: "Psychiatrist, M.D.",
    photo: providerPhoto("shatiria", 200, 1),
    about: "Specializing in mood and anxiety disorders, I provide comprehensive psychiatric assessments combined with therapy.",
    tags: ["Trauma", "Anxiety", "Psychodynamic"],
    price: "350",
  },
  {
    name: "Monica Rios",
    title: "Licensed Professional Counselor, LPC",
    photo: providerPhoto("monica", 200, 1),
    about: "I support teens and adults through life transitions, mood disorders, and self-esteem challenges.",
    tags: ["Trauma", "Self-esteem", "Holistic Wellness"],
    price: "450",
  },
];

/* ---------------------------------------------------------------- pieces */

function Photo({ src, className }: { src: string; className?: string }) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-field bg-warm-100 ring-1 ring-black/[0.06]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover" />
    </span>
  );
}

function Credential({ children }: { children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-secondary @sm:text-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/how-it-works/check-icon.svg" alt="" className="size-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function Chip({ children, dark, className, style }: { children: ReactNode; dark?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-medium @sm:h-7 @sm:text-xs",
        dark ? "bg-warm-900 text-white" : "border border-warm-300 bg-white text-text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

function PreviewButton({ children, brand, className, style }: { children: ReactNode; brand?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span
      style={style}
      className={cn(
        "flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium @sm:h-9 @sm:text-sm",
        brand ? "bg-brand-primary text-white shadow-control" : "border border-warm-300 bg-white text-warm-800",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div aria-hidden className={cn("@container flex w-full flex-col gap-3 select-none @sm:gap-4", className)}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------- search bar */

/** Search bar: toggle + typed query (+ "who feels right" on wide panels). */
function SearchBarPreview({ query = "Trauma", typeAt = 350 }: { query?: string; typeAt?: number }) {
  const typed = useTypewriter(query, typeAt);
  const done = typed.length === query.length;
  return (
    <div className="flex w-full items-center gap-1.5 rounded-[24px] bg-white p-1.5 ring-1 ring-warm-200 shadow-[0_1px_2px_rgb(28_25_23/0.04),0_12px_28px_-16px_rgb(28_25_23/0.22)] @sm:gap-2 @sm:p-2">
      <SessionModeSwitch size="sm" decorative className="ml-1 hidden @md:grid" />
      <span aria-hidden className="hidden h-8 w-px bg-warm-200 @md:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-1.5">
        <p className="text-xs font-medium text-text-primary @sm:text-sm">What&apos;s on your mind?</p>
        <p className="truncate text-xs text-text-placeholder @sm:text-sm">
          I need help with <span className="font-medium text-text-primary">{typed}</span>
          <span className={cn("ml-px inline-block h-3.5 w-px translate-y-0.5 bg-text-primary", done ? "opacity-0" : "animate-caret")} />
        </p>
      </div>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition-[scale,box-shadow] duration-300 @sm:size-11",
          done && "scale-[1.06] shadow-[0_0_0_6px_rgb(192_16_72/0.12)]",
        )}
      >
        <SearchIcon className="size-4" />
      </span>
    </div>
  );
}

/* ------------------------------------------------------ result card */

function ResultCard({ p, delayMs }: { p: (typeof providers)[number]; delayMs: number }) {
  return (
    <div
      style={at(delayMs)}
      className="flex animate-rise-in gap-3 rounded-2xl border border-warm-200 bg-white p-2.5 shadow-control @sm:p-3"
    >
      <Photo src={p.photo} className="size-14 @sm:size-16" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-sm font-medium text-text-primary @sm:text-md">{p.name}</p>
            <Credential>{p.title}</Credential>
          </div>
          <span className="hidden shrink-0 items-center gap-1 rounded-md border border-warm-200 px-1.5 py-0.5 text-[11px] text-text-secondary @md:inline-flex">
            Miami, FL
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/how-it-works/pin-icon.svg" alt="" className="h-3 w-2.5" />
          </span>
        </div>
        <p className="line-clamp-1 text-xs text-text-tertiary @md:line-clamp-2">{p.about}</p>
        <div className="flex flex-wrap gap-1">
          {p.tags.map((t, i) => (
            <Chip key={t} dark={i === 0} className={i === 2 ? "hidden @sm:inline-flex" : undefined}>
              {t}
            </Chip>
          ))}
        </div>
      </div>
      <div className="hidden w-[118px] shrink-0 flex-col justify-between gap-2 rounded-xl bg-warm-50 p-2.5 @lg:flex">
        <div className="flex flex-col">
          <span className="text-[11px] text-text-tertiary">Price per session</span>
          <span className="text-xs text-text-primary">
            From <span className="font-medium">{p.price} USD</span>
          </span>
        </div>
        <PreviewButton brand className="h-7 text-[11px] @sm:h-7 @sm:text-[11px]">
          See profile ↗
        </PreviewButton>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- 1. search */

const filters = ["Female", "Trauma", "PTSD", "English"];

/** Smart search: query types in → filters pop in → results count → cards rise in. */
export function SearchPreview({
  showSearch = true,
  showResults = true,
  query = "Trauma",
  limit = providers.length,
}: {
  showSearch?: boolean;
  showResults?: boolean;
  query?: string;
  /** How many result cards to show. */
  limit?: number;
}) {
  // With the search bar hidden, results start straight away.
  const base = showSearch ? 350 + query.length * 55 + 150 : 0;
  return (
    <Shell>
      {showSearch && <SearchBarPreview query={query} />}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f, i) => (
          <Chip key={f} dark className="animate-pop-in pr-1.5" style={at(base + i * 70)}>
            {f}
            <span className="text-white/60">×</span>
          </Chip>
        ))}
      </div>
      {showResults && (
        <>
          <p className="animate-fade-in text-xs text-text-tertiary @sm:text-sm" style={at(base + 300)}>
            <span className="font-medium text-text-primary">132</span> providers found
          </p>
          <div className="flex flex-col gap-2 @sm:gap-2.5">
            {providers.slice(0, limit).map((p, i) => (
              <ResultCard key={p.name} p={p} delayMs={base + 380 + i * 110} />
            ))}
            {limit < providers.length && (
              <div
                style={at(base + 380 + limit * 110)}
                className="flex animate-rise-in items-center gap-3 rounded-2xl border border-dashed border-warm-300 bg-white/70 px-3 py-2.5"
              >
                <span className="flex -space-x-2">
                  {providers.slice(limit).map((p) => (
                    <Photo key={p.name} src={p.photo} className="size-7 rounded-full ring-2 ring-white" />
                  ))}
                </span>
                <span className="text-xs text-text-secondary @sm:text-sm">
                  and <span className="font-medium text-text-primary">{132 - limit}</span> more providers match
                </span>
              </div>
            )}
          </div>
        </>
      )}
      {!showResults && (
        <div className="flex flex-col gap-2 pt-1">
          {["Session format", "Specialties", "Provider gender"].map((label, i) => (
            <div
              key={label}
              style={at(base + 350 + i * 90)}
              className="flex animate-rise-in items-center justify-between rounded-xl border border-warm-200 bg-white px-3 py-2.5 shadow-control"
            >
              <span className="text-xs font-medium text-text-primary @sm:text-sm">{label}</span>
              <span className="flex gap-1">
                {(i === 0 ? ["Online"] : i === 1 ? ["Trauma", "PTSD"] : ["Female"]).map((v) => (
                  <Chip key={v} dark>
                    {v}
                  </Chip>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

/* ============================================================ full size */
/* One-to-one copies of the live screens, at their real size, for the
   "how it works" process panel. They mirror the directory's result card
   (components/directory/provider-card.tsx) and the session request wizard
   (components/requests/request-wizard.tsx); keep them in step when those change. */

const liveProviders = [
  { ...providers[0], first: "Sara", place: "Miami, FL", online: false, specialties: ["Trauma", "Anxiety", "Mindfulness"], languages: ["English", "Spanish"], type: "Individual one-on-one therapy" },
  { ...providers[1], first: "Shatiria", place: "Online · Florida", online: true, specialties: ["Trauma", "Mood", "Psychodynamic"], languages: ["English"], type: "Individual & Couples therapy" },
  { ...providers[2], first: "Monica", place: "Miami, FL", online: false, specialties: ["Trauma", "Self-esteem", "Teens"], languages: ["English"], type: "Individual one-on-one therapy" },
];


function LiveResultCard({ p, matched, delayMs }: { p: (typeof liveProviders)[number]; matched: string; delayMs: number }) {
  const place = (
    <span className={cn(pill, "w-fit shrink-0", topicChipIdle)}>
      {p.online ? <MonitorIcon className="size-3.5" /> : <MapPinIcon className="size-3.5" />}
      {p.place}
    </span>
  );
  return (
    <article style={at(delayMs)} className="flex animate-rise-in flex-col gap-3 rounded-card border border-warm-200 bg-white p-3">
      <div className="flex gap-3">
        <span className="flex size-20 shrink-0 rounded-2xl border border-black/[0.08] bg-white p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.photo} alt="" className="size-full rounded-xl object-cover" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* the result card's name and verified seal */}
          <p className="flex items-center gap-1.5 pt-0.5 text-base leading-6 font-medium tracking-[-0.01em] text-warm-900">
            {p.name}
            <VerifiedSealIcon className="size-4 shrink-0 text-blue-600" />
          </p>
          <p className="flex min-w-0 items-start gap-2 type-small text-text-tertiary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/how-it-works/verified-check-icon.svg" alt="" className="mt-0.5 size-4 shrink-0" />
            <span>{p.title}</span>
          </p>
          <span className="mt-1">{place}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 rounded-2xl bg-warm-100 p-4">
        <p className="type-small font-medium text-text-primary">About {p.first}</p>
        <p className="line-clamp-3 type-small text-text-secondary">{p.about}</p>
        <span className="w-fit type-small text-text-primary underline underline-offset-2">View more</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {p.specialties.map((t) => (
          <span key={t} className={cn(pill, t === matched ? topicChipOn : topicChipIdle)}>
            {t}
          </span>
        ))}
        <span className={cn(pill, topicChipIdle)}>
          <GlobeIcon className="size-3.5" />
          {p.languages.join(", ")}
        </span>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-warm-100 p-4">
        <dl className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <dt className="type-small text-text-primary">Price per session</dt>
            <dd className="type-small text-text-secondary">
              From <span className="font-medium text-text-primary">{p.price} USD</span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="type-small text-text-primary">Therapy type</dt>
            <dd className="type-small text-text-secondary">{p.type}</dd>
          </div>
        </dl>
        <div className="flex gap-2">
          <span className={cn(buttonVariants({ variant: "brand" }), "h-10 flex-1 text-sm")}>
            See profile
            <CtaArrowIcon />
          </span>
          <span className={cn(buttonVariants({ variant: "secondary", fullWidth: true }), "h-10 flex-1 text-sm")}>
            <HeartIcon />
            Save
          </span>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-warm-200 pt-4 type-small text-text-secondary">
          <p className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/how-it-works/shield-icon.svg" alt="" className="size-4" />
            Your info is never shared
          </p>
          <p className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/how-it-works/verified-check-icon.svg" alt="" className="size-4" />
            Credentials manually verified
          </p>
        </div>
      </div>
    </article>
  );
}

/** Search results as the directory shows them: active filters, the count, then real-size result cards. */
export function ResultsPreview() {
  // Each card is taller than the panel, so once they're in, the list pages
  // down to the next card's top (offsets measured, so it lands exactly).
  const list = useRef<HTMLDivElement>(null);
  const [browse, setBrowse] = useState<CSSProperties | null>(null);
  useEffect(() => {
    const el = list.current;
    if (!el || reducedMotion()) return;
    const cards = el.querySelectorAll<HTMLElement>("article");
    // layout offsets (not rects), so cards still rising in don't skew them;
    // each card lands at the top of the preview
    const top = (i: number) => `${cards[i].offsetTop - el.offsetTop}px`;
    const t = setTimeout(
      () =>
        setBrowse({
          "--b1": top(1),
          "--b2": top(2),
          animation: "results-browse 8s var(--ease-out-soft) both",
        } as CSSProperties),
      1100,
    );
    return () => clearTimeout(t);
  }, []);
  return (
    <Shell>
      {/* filters, count and cards move together, so nothing peeks out behind a card */}
      <div ref={list} style={browse ?? undefined} className="flex flex-col gap-3 @sm:gap-4">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f, i) => (
            <Chip key={f} dark className="animate-pop-in pr-1.5" style={at(i * 70)}>
              {f}
              <span className="text-white/60">×</span>
            </Chip>
          ))}
        </div>
        <p className="animate-fade-in type-small text-text-tertiary" style={at(300)}>
          <span className="font-medium text-text-primary">132</span> providers found
        </p>
        <div className="flex flex-col gap-3">
          {liveProviders.map((p, i) => (
            <LiveResultCard key={p.name} p={p} matched="Trauma" delayMs={380 + i * 120} />
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** True once `ms` has passed since mount (immediately with reduced motion). */
function useAfter(ms: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), reducedMotion() ? 0 : ms);
    return () => clearTimeout(t);
  }, [ms]);
  return on;
}

function WizardDashes({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn("h-1 w-6 rounded-full transition-colors duration-300", i < step ? "bg-blue-600" : "bg-warm-200")} />
      ))}
    </div>
  );
}

function WizardTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="flex animate-rise-in flex-col gap-2">
      <p className="type-ui-label text-warm-500">{eyebrow}</p>
      <p className="type-ui-headline text-warm-900">{title}</p>
      <p className="type-ui-body text-warm-600">{description}</p>
    </div>
  );
}

function WizardProvider() {
  const p = liveProviders[0];
  return (
    <div className="flex animate-rise-in items-center gap-3 rounded-xl border border-warm-200 bg-warm-50 p-3" style={at(90)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.photo} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate type-ui-heading text-warm-900">{p.name}</span>
        <span className="truncate type-ui-small text-warm-600">{p.title}</span>
      </div>
    </div>
  );
}

function WizardButton({ children, delayMs }: { children: ReactNode; delayMs: number }) {
  return (
    <span style={at(delayMs)} className={cn(buttonVariants({ fullWidth: true }), "h-10 animate-rise-in text-[14px]")}>
      {children}
    </span>
  );
}

function WizardChip({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span data-state={on ? "on" : "off"} className={cn(toggleVariants({ variant: "chip", size: "chip" }), "transition-colors duration-300")}>
      {children}
    </span>
  );
}

function SessionDetailsScreen() {
  const type = useAfter(500);
  const format = useAfter(900);
  return (
    <div className="flex flex-col gap-6">
      <WizardDashes step={2} />
      <WizardTitle eyebrow="Step 2 of 5" title="Session details" description="Two quick questions so Sara knows how to prepare." />
      <div className="flex animate-rise-in flex-col gap-2.5" style={at(120)}>
        <p className="type-ui-caption tracking-wide text-warm-500 uppercase">Session type</p>
        <div className="flex flex-wrap gap-2">
          <WizardChip on={type}>{sessionTypeLabel("individuals")}</WizardChip>
          <WizardChip on={false}>{sessionTypeLabel("couples")}</WizardChip>
        </div>
      </div>
      <div className="flex animate-rise-in flex-col gap-2.5" style={at(180)}>
        <p className="type-ui-caption tracking-wide text-warm-500 uppercase">Format</p>
        <div className="flex flex-wrap gap-2">
          <WizardChip on={format}>
            <MonitorIcon className="size-4" />
            {formatLabel("online")}
          </WizardChip>
          <WizardChip on={false}>
            <MapPinIcon className="size-4" />
            {formatLabel("in_person")}
          </WizardChip>
        </div>
      </div>
      <WizardButton delayMs={240}>Continue</WizardButton>
    </div>
  );
}

const wizardScreens = [
  () => (
    <div className="flex flex-col gap-6">
      <WizardDashes step={1} />
      <WizardTitle eyebrow="Step 1 of 5" title="Confirm your request" description="You selected Sara Oliisi" />
      <WizardProvider />
      <WizardButton delayMs={180}>Confirm</WizardButton>
    </div>
  ),
  () => <SessionDetailsScreen />,
  () => (
    <div className="flex flex-col gap-6">
      <WizardTitle
        eyebrow="Request confirmed"
        title="You're all set"
        description="Sara has received your request and will reach out to you directly within 48 hours."
      />
      <div className="flex animate-rise-in items-start gap-4 rounded-xl border border-warm-200 bg-warm-50 p-4" style={at(120)}>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="type-ui-heading text-warm-900">We sent an email on your behalf!</p>
          <p className="truncate type-ui-body font-medium text-blue-700">
            j<span className="tracking-[0.12em]">••••••</span>@gmail.com
          </p>
          <p className="type-ui-small text-warm-600">You’ll be contacted directly by email or phone to confirm everything.</p>
        </div>
        <LucideSendIcon className="mt-1 size-6 shrink-0 text-warm-400" />
      </div>
      <WizardButton delayMs={240}>Back to search</WizardButton>
    </div>
  ),
];

/** The session request wizard as patients see it, in the portal's own styles, stepping through on its own. */
export function RequestWizardPreview({ every = 2600, loop = false }: { every?: number; loop?: boolean }) {
  const step = useCycle(wizardScreens.length, every, loop);
  const Screen = wizardScreens[step];
  return (
    <div aria-hidden className="app-ui w-full select-none">
      <Screen key={step} />
    </div>
  );
}
