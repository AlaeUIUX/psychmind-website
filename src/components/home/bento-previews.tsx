"use client";

import { cn } from "cn";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { CheckIcon, LockIcon, ShieldIcon, UserIcon } from "@/components/ui/hugeicons";
import { SearchIcon } from "@/components/ui/icons";
import { VerifiedBadge } from "@/components/ui/tag";
import { providerPhotoSource } from "@/lib/photos";
import { sessionTypeLabel } from "@/lib/requests";
import { GENDERS } from "@/lib/taxonomy";
import {
  panelHeading,
  searchLift,
  searchSurface,
  segmentFrost,
  segmentLabel,
  segmentLift,
  segmentValue,
  SUGGESTIONS,
  topicChip,
  topicChipIdle,
  topicChipOn,
} from "./search-styles";

// The bento's pictures of the product, all drawn in the hero search bar's own
// language (search-styles.ts) so the four read as one product: its white
// surface and 24px corners, 14px values over 12px labels, its chips and its
// crimson button. The first is the bar itself; the others are one card on that
// surface with the same parts: a head (a round 40px lead, a 14px title over a
// 12px line, a badge), a hairline, then 32px rows or choices. All left-aligned.
//
// They're pictures, not controls: nothing in them responds to a click. Each
// plays while its card is hovered (`active`) and settles back when the pointer
// leaves. Screens without hover, and reduced motion, show the finished state.
// Every surface runs past the bottom of the card's window, so its lower
// corners are always out of sight under the fade.

const STILL = "(prefers-reduced-motion: reduce), (hover: none)";
/** For pictures played by scrolling rather than hover: only reduced motion holds them still. */
export const STILL_REDUCED = "(prefers-reduced-motion: reduce)";

/** True where `query` matches: by default, reduced motion, or no hover to play them. */
function useStill(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

/** 0 at rest; while `active`, 1, 2… at each time in `schedule` (ms). Back to 0
 *  when it ends. Screens matching `stillOn` get the last step. */
export function useStep(active: boolean, schedule: readonly number[], stillOn: string = STILL) {
  const still = useStill(stillOn);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (still) return;
    const timers = active
      ? schedule.map((ms, i) => window.setTimeout(() => setStep(i + 1), ms))
      : [window.setTimeout(() => setStep(0), 0)];
    return () => timers.forEach(clearTimeout);
  }, [active, still, schedule]);
  return still ? schedule.length : step;
}

/** The element's width, kept up to date. */
function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** The shared surface: the bar's, 24px corners, and taller than the window. */
const surface = cn(searchSurface, "min-h-[240px] rounded-[24px] p-4");
const hairline = "mt-3 border-t border-warm-200 pt-3";
const SARA = { name: "Sara Oliisi", title: "Counselor, LMHC, M.S., B.S." };

function Avatar() {
  return (
    <Image
      src={providerPhotoSource("sara", 96)}
      alt=""
      width={40}
      height={40}
      className="size-10 shrink-0 rounded-full object-cover object-[50%_20%]"
    />
  );
}

function Head({ lead, title, line, badge }: { lead: ReactNode; title: ReactNode; line: ReactNode; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {lead}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm leading-[18px] font-medium text-warm-900">{title}</p>
        <p className="truncate text-xs leading-4 text-warm-500">{line}</p>
      </div>
      {badge}
    </div>
  );
}

function Row({ icon, children, end }: { icon: ReactNode; children: ReactNode; end?: ReactNode }) {
  return (
    <li className="flex h-8 items-center gap-2 border-t border-warm-100 text-xs leading-4 first:border-t-0 [&>svg]:size-3.5 [&>svg]:shrink-0">
      {icon}
      <span className="min-w-0 flex-1 truncate text-warm-700">{children}</span>
      {end}
    </li>
  );
}

const caret = <span className="inline-block h-3.5 w-px translate-y-0.5 animate-caret bg-warm-900" />;

/* ------------------------------------------------------------ 1. search */

const QUERY = "Trauma";
const GENDER_CHIPS = GENDERS.filter((g) => g.value !== "undisclosed").map((g) => g.label);
const PICKED = GENDER_CHIPS[0];
// "What's on your mind?" opens, the query types in a letter at a time, then
// (where the bar has room for it) "Who feels right" opens and a gender is picked
const SEARCH_MIND = [150, ...Array.from(QUERY, (_, i) => 650 + i * 80)];
const SEARCH_ALL = [...SEARCH_MIND, 1700, 2400];
/** Wide enough for both segments and the grown button (measured in Inter). */
const BOTH_SEGMENTS = 416;

/** The hero bar's right-hand two segments, playing its own flow: "What's on
 *  your mind?" lifts (the rest frosts over, the button grows into "Search"),
 *  its panel drops with the popular searches, "Trauma" types in and lights
 *  its chip, then "Who feels right" lifts and "Female" is picked. Narrow cards
 *  show "What's on your mind?" alone, and stop there. */
export function SearchVisual({ active }: { active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const wide = useWidth(root) >= BOTH_SEGMENTS;
  const step = useStep(active, wide ? SEARCH_ALL : SEARCH_MIND);
  const open = step >= 1;
  const prefs = step > SEARCH_MIND.length;
  const typed = QUERY.slice(0, Math.max(0, Math.min(step - 1, QUERY.length)));
  const typing = open && !prefs && typed !== QUERY;
  const picked = step > SEARCH_MIND.length + 1 ? PICKED : "";

  const button = (
    <span
      className={cn(
        "flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[16px] bg-brand-primary text-sm font-medium text-white transition-[width] duration-300 ease-out-soft",
        open ? "w-[100px]" : "w-12",
      )}
    >
      <SearchIcon className="size-4 shrink-0" />
      {open && <span>Search</span>}
    </span>
  );

  return (
    <div ref={root} className="@container flex min-h-[240px] flex-col gap-3">
      <div className={cn("flex h-[66px] items-center rounded-[25px] transition-shadow duration-300", searchSurface, open && searchLift)}>
        <div
          className={cn(
            "flex h-full min-w-0 flex-1 items-center rounded-[24px] transition-[background-color,box-shadow] duration-200",
            open && !prefs && segmentLift,
          )}
        >
          <div className={cn("flex min-w-0 flex-1 flex-col px-5 transition-[filter,opacity] duration-300 ease-out-soft", prefs && segmentFrost)}>
            <span className={cn(segmentLabel, "truncate")}>What&apos;s on your mind?</span>
            <span className={cn(segmentValue, typed ? "font-medium text-warm-900" : "text-warm-500")}>
              {typing && !typed && caret}
              {typed || "What would you like to work on?"}
              {typing && typed && caret}
            </span>
          </div>
        </div>
        {/* narrow: the button after the one segment */}
        <div className="mr-[9px] ml-2 @min-[416px]:hidden">{button}</div>

        <span className={cn("hidden h-8 w-px shrink-0 bg-warm-200 transition-opacity duration-200 @min-[416px]:block", open && "opacity-0")} />
        <div
          className={cn(
            "hidden h-full shrink-0 items-center rounded-[24px] pr-2 transition-[background-color,box-shadow] duration-200 @min-[416px]:flex",
            prefs && segmentLift,
          )}
        >
          <div className={cn("flex w-[139px] flex-col pr-2 pl-5 transition-[filter,opacity] duration-300 ease-out-soft", open && !prefs && segmentFrost)}>
            <span className={segmentLabel}>Who feels right</span>
            <span className={cn(segmentValue, picked ? "font-medium text-warm-900" : "text-warm-500")}>{picked || "Add preferences"}</span>
          </div>
          {button}
        </div>
      </div>

      {/* the panel, under the bar; it runs off the foot of the window */}
      <div
        className={cn(
          "flex-1 rounded-[24px] bg-white p-4 shadow-[0_6px_20px_rgb(0_0_0/0.2)] transition-[opacity,translate] duration-300 ease-out-soft",
          open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        )}
      >
        {prefs ? (
          <div key="prefs" className="animate-in duration-300 fade-in-0">
            <p className={panelHeading}>
              <UserIcon />
              Provider gender
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {GENDER_CHIPS.map((g) => (
                <span key={g} className={cn(topicChip, g === picked ? topicChipOn : topicChipIdle)}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div key="mind" className="animate-in duration-300 fade-in-0">
            <p className={panelHeading}>Popular searches</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((t) => (
                <span key={t} className={cn(topicChip, t === typed ? topicChipOn : topicChipIdle)}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- 2. verified */

const CHECKS = [
  { label: "License", value: "LMHC · #MA-2941" },
  { label: "Education", value: "M.S. Clinical Counseling" },
  { label: "Identity", value: "Government ID" },
];
// each credential ticks over, then the badge
const VERIFY_AT = [300, 650, 1000, 1350];

function Tick({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
        ok ? "bg-warm-900 text-white" : "border border-dashed border-warm-300",
      )}
    >
      {ok && <CheckIcon className="size-2.5 animate-pop-in" strokeWidth={3} />}
    </span>
  );
}

/** A provider being checked: each credential ticks over, then "Verified" appears. */
export function VerifiedVisual({ active }: { active: boolean }) {
  const step = useStep(active, VERIFY_AT);
  return (
    <div className={surface}>
      <Head
        lead={<Avatar />}
        title={SARA.name}
        line={SARA.title}
        badge={
          // its space is kept, so the head doesn't shift as it appears
          <span
            className={cn(
              "transition-[opacity,scale] duration-300 ease-out-soft",
              step > CHECKS.length ? "scale-100 opacity-100" : "scale-90 opacity-0",
            )}
          >
            <VerifiedBadge size="sm" />
          </span>
        }
      />
      <div className={hairline}>
        <p className={panelHeading}>Credentials &amp; qualifications</p>
        <ul className="mt-1.5">
          {CHECKS.map((c, i) => {
            const ok = i < step;
            return (
              <Row
                key={c.label}
                icon={<Tick ok={ok} />}
                end={
                  <span className={cn("shrink-0 transition-colors duration-300", ok ? "font-medium text-warm-900" : "text-warm-400")}>
                    {ok ? c.value : "Checking…"}
                  </span>
                }
              >
                {c.label}
              </Row>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- 3. request */

// the session type is picked, the button pressed, and the request goes
const REQUEST_AT = [400, 1100, 1350];

/** The request: who it's for, the session type picked, then "Confirm request"
 *  turning into "Request confirmed". */
export function RequestVisual({ active }: { active: boolean }) {
  const step = useStep(active, REQUEST_AT);
  const sent = step >= 3;
  return (
    <div className={surface}>
      <Head lead={<Avatar />} title={SARA.name} line={SARA.title} />
      {/* on the narrowest phones the chips drop under the heading */}
      <div className={cn(hairline, "flex flex-wrap items-center justify-between gap-x-3 gap-y-2")}>
        <p className={cn(panelHeading, "whitespace-nowrap")}>Session type</p>
        <div className="flex gap-1.5">
          {["individuals", "couples"].map((t, i) => (
            <span key={t} className={cn(topicChip, i === 0 && step >= 1 ? topicChipOn : topicChipIdle)}>
              {sessionTypeLabel(t)}
            </span>
          ))}
        </div>
      </div>
      <span
        className={cn(
          "mt-3 flex h-10 items-center justify-center gap-2 rounded-[13px] text-sm font-medium text-white transition-[background-color,scale] duration-200",
          sent ? "bg-warm-900" : step === 2 ? "scale-[0.98] bg-brand-primary-hover" : "bg-brand-primary",
        )}
      >
        {sent ? (
          <>
            <CheckIcon className="size-4 animate-pop-in" strokeWidth={2.5} />
            Request confirmed
          </>
        ) : (
          "Confirm request"
        )}
      </span>
    </div>
  );
}

/* ------------------------------------------------------ 4. confidential */

const PRIVACY = [
  { Icon: ShieldIcon, text: "Your info is never shared or sold" },
  { Icon: LockIcon, text: "Messages stay between you and Sara" },
];
// the lock shuts, then each promise lights up
const PRIVACY_AT = [200, 550, 800];

/** The lock in the head's round lead: open at rest, its shackle drops shut.
 *  (Also the privacy promise's lead, in verified-providers.tsx.) */
export function Lock({ shut, className }: { shut: boolean; className?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-warm-100 text-warm-900", className)}>
      <LockGlyph shut={shut} className="size-5" />
    </span>
  );
}

/** The padlock itself, its shackle dropping shut. */
export function LockGlyph({ shut, className }: { shut: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path
        d="M8 11V8a4 4 0 1 1 8 0v3"
        className="transition-transform duration-500 ease-spring"
        style={{ transform: shut ? undefined : "translateY(-3px)" }}
      />
      <rect x="5.5" y="11" width="13" height="9" rx="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** "Sent on your behalf": the email masked, who can see it, then what stays private. */
export function PrivacyVisual({ active }: { active: boolean }) {
  const step = useStep(active, PRIVACY_AT);
  return (
    <div className={surface}>
      <Head
        lead={<Lock shut={step >= 1} />}
        title="We sent an email on your behalf!"
        line={
          <>
            j<span className="tracking-[0.12em]">••••••</span>@gmail.com
          </>
        }
      />
      <div className={hairline}>
        <p className="text-xs leading-4 text-warm-500">Only Sara can see how to reach you, directly by email or phone.</p>
        <ul className="mt-1.5">
          {PRIVACY.map(({ Icon, text }, i) => {
            const on = step > i + 1;
            return (
              <Row
                key={text}
                icon={<Icon key={String(on)} className={cn("transition-colors duration-300", on ? "animate-pop-in text-warm-900" : "text-warm-400")} />}
              >
                {text}
              </Row>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
