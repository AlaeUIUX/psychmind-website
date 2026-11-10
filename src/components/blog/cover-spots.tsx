import { cn } from "cn";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  frame,
  frameCard,
  panelHeading,
  pill,
  searchLift,
  searchSurface,
  segmentFrost,
  segmentLabel,
  segmentLift,
  segmentValue,
  SUGGESTIONS,
  topicChipIdle,
  topicChipOn,
} from "@/components/home/search-styles";
import { CheckIcon } from "@/components/ui/hugeicons";
import { MapPinIcon, MonitorIcon, SearchIcon } from "@/components/ui/icons";
import { VerifiedBadge } from "@/components/ui/tag";
import { providerPhotoSource } from "@/lib/photos";
import { sessionTypeLabel } from "@/lib/requests";

// The pictures on the blog's covers (post-cover.tsx), after incident.io's, and the
// owner's rule for them (2026-11-10): a post about the product shows the actual thing
// in our own UI (the search bar, the credentials card, the dashboard, the approach
// filter, the request card) or a quiet diagram where it explains a rule; a post about
// people shows the girl, in the landing's dot print (her boat, two roads, a rain
// cloud). Nothing written on them and nothing decorative around them.
//
// Each fills the cover's 640 × 360 stage, its subject in the upper two thirds: the
// cover fades and blurs whatever reaches the foot. Depth is the landing's: what the
// post is about stays sharp, what's behind it is frosted (segmentFrost), and things
// lie on each other with the UI's own shadows.
//
// A post picks one by name (`cover:` in its front matter); a new post can reuse one
// or get its own here (the girl's are drawn in src/app/dev/cover-studio).

const SARA = { name: "Sara Oliisi", title: "Counselor, LMHC, M.S., B.S." };
const caret = <span className="ml-px inline-block h-[17px] w-px translate-y-[3px] bg-warm-900" />;

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

/** A provider card's head, as on the landing's bento: photo, name and title, a badge. */
function Head({ badge }: { badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm leading-[18px] font-medium text-warm-900">{SARA.name}</p>
        <p className="truncate text-xs leading-4 text-warm-500">{SARA.title}</p>
      </div>
      {badge}
    </div>
  );
}

/** The pointer, resting on something. */
function Pointer({ x, y }: { x: number; y: number }) {
  return (
    <svg viewBox="0 0 20 24" className="absolute w-[20px] drop-shadow-[0_2px_3px_rgb(0_0_0/0.18)]" style={{ left: x, top: y }}>
      <path d="M2 2L2 19L6.5 14.8L9.4 21.4L12.4 20.1L9.6 13.6L15.6 13.4Z" fill="white" stroke="#1c1917" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ the search */

/** The home page's search bar, "What's on your mind?" open with Anxiety typed and
 *  the other segments frosted, its panel of popular searches dropping under it. */
function SearchArt() {
  return (
    <>
      <div className="absolute top-[116px] left-[178px] w-[300px] rounded-[24px] bg-white p-5 shadow-[0_6px_20px_rgb(0_0_0/0.2)]">
        <p className={panelHeading}>Popular searches</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((t) => (
            <span key={t} className={cn(pill, t === "Anxiety" ? topicChipOn : topicChipIdle)}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className={cn("absolute top-[34px] left-[46px] flex h-[66px] w-[548px] items-center rounded-[25px]", searchSurface, searchLift)}>
        <div className={cn("flex w-[148px] shrink-0 flex-col px-5", segmentFrost)}>
          <span className={segmentLabel}>Session format</span>
          <span className={cn(segmentValue, "flex items-center gap-1.5 text-warm-900")}>
            <MonitorIcon className="size-3.5 text-brand-primary" />
            Online
          </span>
        </div>
        <div className={cn("flex h-full min-w-0 flex-1 items-center rounded-[24px]", segmentLift)}>
          <div className="flex flex-col px-5">
            <span className={segmentLabel}>What&apos;s on your mind?</span>
            <span className={cn(segmentValue, "font-medium text-warm-900")}>
              Anxiety
              {caret}
            </span>
          </div>
        </div>
        <div className={cn("flex w-[150px] shrink-0 flex-col pr-2 pl-5", segmentFrost)}>
          <span className={segmentLabel}>Who feels right</span>
          <span className={cn(segmentValue, "text-warm-500")}>Add preferences</span>
        </div>
        <span className="mr-[9px] flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-brand-primary text-white">
          <SearchIcon className="size-4" />
        </span>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- verification */

const CHECKS = [
  { label: "License", value: "LMHC · #MA-2941" },
  { label: "Education", value: "M.S. Clinical Counseling" },
  { label: "Identity", value: "Government ID" },
];

/** The landing's credentials card, every check ticked. */
function Credentials() {
  return (
    <div className={cn("absolute top-[44px] left-[150px] w-[340px] rounded-[24px] p-4", searchSurface)}>
      <Head badge={<VerifiedBadge size="sm" />} />
      <div className="mt-3 border-t border-warm-200 pt-3">
        <p className={panelHeading}>Credentials &amp; qualifications</p>
        <ul className="mt-1.5">
          {CHECKS.map((c) => (
            <li key={c.label} className="flex h-8 items-center gap-2 border-t border-warm-100 text-xs leading-4 first:border-t-0">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-warm-900 text-white">
                <CheckIcon className="size-2.5" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1 truncate text-warm-700">{c.label}</span>
              <span className="shrink-0 font-medium text-warm-900">{c.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Where the loupe sits (its centre, on the card's Verified badge) and how much it magnifies. */
const LOUPE = { x: 434, y: 80, size: 128, zoom: 2 };

/** The credentials card under a loupe that magnifies its Verified badge. */
function VerifiedArt() {
  const { x, y, size, zoom } = LOUPE;
  return (
    <>
      <Credentials />
      <div
        className="absolute overflow-hidden rounded-full bg-white shadow-[0_0_0_5px_white,0_0_0_6px_rgb(0_0_0/0.08),0_14px_32px_rgb(0_0_0/0.18)]"
        style={{ left: x - size / 2, top: y - size / 2, width: size, height: size }}
      >
        <div
          className="absolute h-[360px] w-[640px]"
          style={{ left: size / 2 - x, top: size / 2 - y, scale: zoom, transformOrigin: `${x}px ${y}px` }}
        >
          <Credentials />
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------- location */

const PLACES = [
  { place: "Miami Beach, FL", note: "Same ZIP" },
  { place: "Miami, FL", note: "Same city" },
  { place: "Florida", note: "Same state" },
];

/** The search bar's session format, opened: In person chosen, a ZIP typed, and the
 *  places search widens through, in order, never further than the state. */
function LocationArt() {
  return (
    <div className={cn("absolute top-[22px] left-[150px] w-[340px] rounded-[24px] bg-white p-5", searchSurface, searchLift)}>
      <p className={panelHeading}>Session format</p>
      <div className="mt-3 grid grid-cols-2 rounded-[16px] bg-warm-900/[0.05] p-1 text-[13px]">
        <span className="flex h-9 items-center justify-center gap-1.5 text-warm-500">
          <MonitorIcon className="size-3.5" />
          Online
        </span>
        <span className="flex h-9 items-center justify-center gap-1.5 rounded-[12px] border border-warm-900/10 bg-white text-warm-900">
          <MapPinIcon className="size-3.5 text-brand-primary" />
          In person
        </span>
      </div>
      <p className={cn(panelHeading, "mt-4")}>Where?</p>
      <div className="mt-2 flex h-10 items-center rounded-[12px] border border-warm-300 px-3 text-sm text-warm-900">
        33139
        {caret}
      </div>
      <ul className="mt-2">
        {PLACES.map((p, i) => (
          <li
            key={p.place}
            className={cn("flex h-9 items-center justify-between rounded-[10px] px-3 text-[13px]", i === 0 ? "bg-warm-900/[0.05] text-warm-900" : "text-warm-700")}
          >
            <span className="flex items-center gap-2">
              <MapPinIcon className="size-3.5 text-warm-500" />
              {p.place}
            </span>
            <span className="text-xs text-warm-500">{p.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------- analytics */

const DAYS = [38, 52, 44, 61, 49, 70, 64, 57, 78, 62, 88, 72, 84, 68];
const TERMS = [
  ["Anxiety · Online · Florida", 12],
  ["Trauma · In person · Miami", 7],
  ["Depression · Online · Texas", 5],
] as const;

/** A provider's dashboard: profile views as daily totals, the search terms that found
 *  them (rebuilt from filters) frosted behind. */
function AnalyticsArt() {
  return (
    <>
      <div className={cn("absolute top-[22px] left-[318px] w-[290px] rounded-[16px] border border-warm-200 bg-white p-4", segmentFrost)}>
        <p className="text-xs leading-4 font-medium text-warm-500">Search terms</p>
        <ul className="mt-2">
          {TERMS.map(([term, n]) => (
            <li key={term} className="flex h-8 items-center justify-between border-t border-warm-100 text-xs first:border-t-0">
              <span className="text-warm-700">{term}</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-warm-900">{n}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute top-[26px] left-[84px] w-[360px] rounded-[16px] border border-warm-200 bg-white p-5 shadow-[0_8px_24px_rgb(0_0_0/0.08)]">
        <div className="flex items-center justify-between">
          <p className="text-xs leading-4 font-medium text-warm-500">Profile views</p>
          <span className="rounded-full border border-warm-200 px-2 py-0.5 text-[11px] leading-4 text-warm-700">Last 14 days</span>
        </div>
        <p className="mt-1.5 font-[family-name:var(--font-geist-mono)] text-[28px] leading-[34px] font-medium tracking-[-0.03em] text-warm-900">
          887
        </p>
        <div className="mt-4 flex h-[72px] items-end gap-[7px] border-b border-warm-200">
          {DAYS.map((h, i) => (
            <span
              key={i}
              className={cn("flex-1 rounded-t-[4px]", i === DAYS.length - 1 ? "bg-warm-900" : "bg-warm-900/15")}
              style={{ height: Math.round(h * 0.78) }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------- approach */

const APPROACHES = ["CBT", "Psychodynamic", "Mindfulness", "DBT", "EMDR", "Humanistic"];

/** The search's filters column, the session format above running off the top
 *  (frosted), the therapy approach in focus: CBT chosen, the pointer on Psychodynamic. */
function ApproachArt() {
  return (
    <>
      <div className={cn(frame, "absolute top-[-78px] left-[136px] w-[368px]")}>
        <div className={cn(frameCard, "p-5")}>
          <div className={segmentFrost}>
            <p className="type-overline text-text-secondary">Session format</p>
            <div className="mt-3 grid grid-cols-2 rounded-[16px] bg-warm-900/[0.05] p-1 text-[13px]">
              <span className="flex h-9 items-center justify-center gap-1.5 rounded-[12px] border border-warm-900/10 bg-white text-warm-900">
                <MonitorIcon className="size-3.5 text-brand-primary" />
                Online
              </span>
              <span className="flex h-9 items-center justify-center text-warm-500">In person</span>
            </div>
          </div>
          <div className="mt-5 border-t border-warm-200 pt-5 pb-10">
            <p className="type-overline text-text-secondary">Therapy approach</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {APPROACHES.map((a) => (
                <span
                  key={a}
                  className={cn(
                    pill,
                    a === "CBT" ? topicChipOn : a === "Psychodynamic" ? "border-warm-600 bg-white text-text-primary" : topicChipIdle,
                  )}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Pointer x={282} y={104} />
    </>
  );
}

/* --------------------------------------------------------------------- request */

/** The request card: Individual picked, the pointer on Confirm request. */
function RequestArt() {
  return (
    <>
      <div className={cn("absolute top-[16px] left-[150px] w-[340px] rounded-[24px] p-4", searchSurface, searchLift)}>
        <Head />
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-warm-200 pt-3">
          <p className={panelHeading}>Session type</p>
          <div className="flex gap-1.5">
            {["individuals", "couples"].map((t, i) => (
              <span key={t} className={cn(pill, i === 0 ? topicChipOn : topicChipIdle)}>
                {sessionTypeLabel(t)}
              </span>
            ))}
          </div>
        </div>
        <span className="mt-3 flex h-10 items-center justify-center rounded-[13px] bg-brand-primary text-sm font-medium text-white">
          Confirm request
        </span>
      </div>
      <Pointer x={350} y={152} />
    </>
  );
}

/* --------------------------------------------------------------------- the girl */

/** One of the girl's pictures, drawn in the landing's dot print (src/app/dev/
 *  cover-studio, saved by scripts/render-covers.mjs), filling the stage. */
function Picture({ name }: { name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/images/blog/covers/${name}.png`} alt="" width={640} height={360} className="absolute inset-0 size-full" />;
}

/** The UI pictures, close up as on the landing's bento: shown `zoom` times their real
 *  size, the point (x, y) of their layout set where the fade leaves the most room, so
 *  they run off the edges rather than sit small in the middle. */
const close = (Art: () => ReactNode, zoom: number, x: number, y: number) =>
  function CloseUp() {
    return (
      <div className="absolute inset-0" style={{ transformOrigin: `${x}px ${y}px`, transform: `translate(${320 - x}px, ${150 - y}px) scale(${zoom})` }}>
        <Art />
      </div>
    );
  };

export const COVER_ART = {
  search: { label: "The search bar", Art: close(SearchArt, 1.35, 300, 110) },
  verified: { label: "Credentials under a loupe", Art: close(VerifiedArt, 1.5, 345, 112) },
  location: { label: "Search's session format and places", Art: close(LocationArt, 1.35, 320, 188) },
  analytics: { label: "Daily totals on the dashboard", Art: close(AnalyticsArt, 1.45, 290, 110) },
  approach: { label: "The therapy approach filter", Art: close(ApproachArt, 1.6, 300, 100) },
  request: { label: "The request card", Art: close(RequestArt, 1.6, 320, 105) },
  boat: { label: "The girl in her boat", Art: () => <Picture name="boat" /> },
  "two-roads": { label: "The girl where two roads part", Art: () => <Picture name="two-roads" /> },
  "rain-cloud": { label: "The girl under a rain cloud", Art: () => <Picture name="rain-cloud" /> },
} as const;

export type CoverArt = keyof typeof COVER_ART;

export const isCoverArt = (name: unknown): name is CoverArt => typeof name === "string" && Object.hasOwn(COVER_ART, name);
