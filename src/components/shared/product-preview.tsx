"use client";

import { cn } from "cn";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { SearchIcon, SendIcon } from "@/components/ui/icons";
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
            <p className="truncate text-sm font-semibold text-text-primary @sm:text-md">{p.name}</p>
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
            From <span className="font-semibold">{p.price} USD</span>
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
            <span className="font-semibold text-text-primary">132</span> providers found
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
                  and <span className="font-semibold text-text-primary">{132 - limit}</span> more providers match
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

/* ------------------------------------------------------- 2. verified */

export const checks = [
  { label: "License", value: "LMHC · #MA-2941" },
  { label: "Education", value: "M.S. Clinical Counseling" },
  { label: "Identity", value: "Government ID" },
  { label: "Practice", value: "Miami, FL 33131" },
];

/* -------------------------------------------------------- 3. request */

function StepBar({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-[3px] w-5 overflow-hidden rounded-full bg-warm-200">
            <span
              className={cn(
                "block h-full origin-left rounded-full bg-brand-primary transition-transform duration-700 ease-out-soft",
                i <= step ? "scale-x-100" : "scale-x-0",
              )}
            />
          </span>
        ))}
      </div>
      <p className="text-[11px] text-text-tertiary">
        Step {step + 1} of {total}
      </p>
    </div>
  );
}

function ProviderRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-warm-200 bg-warm-50 p-2">
      <Photo src={providers[0].photo} className="size-10 rounded-lg" />
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-medium text-text-primary @sm:text-sm">Dr. {providers[0].name}</span>
        <span className="truncate text-[11px] text-text-tertiary @sm:text-xs">{providers[0].title}</span>
      </div>
    </div>
  );
}

const requestScreens = [
  // Step 1 — Confirm your request
  (key: number) => (
    <div key={key} className="flex flex-col gap-3">
      <StepBar step={0} />
      <div className="flex animate-rise-in flex-col gap-0.5">
        <p className="font-display text-lg leading-6 text-text-primary @sm:text-xl">Confirm your request</p>
        <p className="text-xs text-text-tertiary">You selected Dr. Sara Oliisi</p>
      </div>
      <div className="animate-rise-in" style={at(90)}>
        <ProviderRow />
      </div>
      <PreviewButton brand className="animate-rise-in" style={at(180)}>
        Confirm
      </PreviewButton>
    </div>
  ),
  // Step 2 — Session details
  (key: number) => (
    <div key={key} className="flex flex-col gap-3">
      <StepBar step={1} />
      <div className="flex animate-rise-in flex-col gap-0.5">
        <p className="font-display text-lg leading-6 text-text-primary @sm:text-xl">Session details</p>
        <p className="text-xs text-text-tertiary">Two quick questions so Sara knows how to prepare.</p>
      </div>
      <div className="flex animate-rise-in flex-col gap-1.5" style={at(90)}>
        <span className="text-[10px] font-medium tracking-[0.06em] text-text-tertiary uppercase">Session type</span>
        <span className="flex gap-1.5">
          <Chip className="animate-[chip-select_350ms_ease-out_both]" style={at(420)}>
            Individual
          </Chip>
          <Chip>Couples</Chip>
        </span>
      </div>
      <div className="flex animate-rise-in flex-col gap-1.5" style={at(160)}>
        <span className="text-[10px] font-medium tracking-[0.06em] text-text-tertiary uppercase">Format</span>
        <span className="flex gap-1.5">
          <Chip className="animate-[chip-select_350ms_ease-out_both]" style={at(700)}>
            Online
          </Chip>
          <Chip>In-person</Chip>
        </span>
      </div>
      <PreviewButton brand className="animate-rise-in" style={at(240)}>
        Continue
      </PreviewButton>
    </div>
  ),
  // Done — You're all set
  (key: number) => (
    <div key={key} className="flex flex-col items-center gap-3 py-1 text-center">
      <span className="flex size-11 animate-pop-in items-center justify-center rounded-full bg-brand-soft text-brand-primary ring-1 ring-brand-primary/15">
        <SendIcon className="size-5" />
      </span>
      <div className="flex animate-rise-in flex-col gap-1" style={at(120)}>
        <p className="text-[11px] text-text-tertiary">Request confirmed</p>
        <p className="font-display text-lg leading-6 text-text-primary @sm:text-xl">You&apos;re all set</p>
        <p className="mx-auto max-w-[260px] text-xs text-text-tertiary">
          Sara has received your request and will reach out to you directly within 48 hours.
        </p>
      </div>
      <PreviewButton className="w-full animate-rise-in" style={at(240)}>
        Back to search
      </PreviewButton>
    </div>
  ),
];

/** Request flow from the Figma booking screens, auto-playing step to step. */
export function RequestPreview({ every = 2600, loop = true }: { every?: number; loop?: boolean }) {
  const step = useCycle(requestScreens.length, every, loop);
  return (
    <Shell>
      <div className="grid animate-rise-in overflow-hidden rounded-2xl border border-warm-200 bg-white shadow-card @lg:grid-cols-[1fr_38%]">
        <div className="flex min-h-[300px] flex-col justify-center p-4 @sm:min-h-[310px] @sm:p-5">{requestScreens[step](step)}</div>
        {/* The booking screens pair the form with this calm landscape (Figma 194:14819). */}
        <div className="hidden bg-[url('/images/providers/booking-landscape.jpg')] bg-cover bg-bottom @lg:block" />
      </div>
    </Shell>
  );
}

/* ---------------------------------------------------- 4. confidential */

function LockBadge() {
  return (
    <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warm-900 text-white shadow-card">
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {/* shackle drops shut after mount */}
        <path d="M8 11V8a4 4 0 1 1 8 0v3" className="animate-[lock-shut_700ms_cubic-bezier(0.34,1.4,0.64,1)_600ms_both]" />
        <rect x="5.5" y="11" width="13" height="9" rx="2.5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

const privacyRows = [
  { icon: "/images/how-it-works/shield-icon.svg", text: "Your info is never shared or sold" },
  { icon: "/images/how-it-works/check-icon.svg", text: "Messages stay between you and Sara" },
  { icon: "/images/how-it-works/verified-check-icon.svg", text: "Credentials manually verified" },
];

/** Confidentiality: the "sent on your behalf" card with the email masked, and the trust rows. */
export function PrivacyPreview() {
  return (
    <Shell>
      <div className="flex animate-rise-in items-start gap-3 rounded-2xl border border-warm-200 bg-white p-3.5 shadow-control @sm:p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-xs font-medium text-text-primary @sm:text-sm">We sent an email on your behalf!</p>
          <p className="text-xs text-brand-primary @sm:text-sm">
            j<span className="tracking-[0.12em]">••••••</span>@gmail.com
          </p>
          <p className="text-[11px] text-text-tertiary @sm:text-xs">Only Sara can see how to reach you — directly by email or phone.</p>
        </div>
        <LockBadge />
      </div>
      <ul className="flex flex-col gap-2">
        {privacyRows.map((r, i) => (
          <li
            key={r.text}
            style={at(260 + i * 110)}
            className="flex animate-rise-in items-center gap-3 rounded-xl border border-warm-200 bg-white px-3 py-2.5 shadow-control"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warm-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.icon} alt="" className="size-3.5" />
            </span>
            <span className="text-xs text-text-secondary @sm:text-sm">{r.text}</span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
