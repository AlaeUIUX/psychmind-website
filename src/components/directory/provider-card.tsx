"use client";

import { cn } from "cn";
import { CtaArrowIcon, GlobeIcon, MapPinIcon, MonitorIcon, SparklesIcon, UserRoundIcon } from "@/components/ui/hugeicons";
import { frame, frameCard, frameColumn, pill, topicChipIdle, topicChipOn } from "@/components/home/search-styles";
import { Button } from "@/components/ui/button";
import { VerifiedSealIcon } from "@/components/ui/icons";
import { displayName, feeFrom, locationLabel, shortName, therapyType } from "@/lib/provider/display";
import { useImpression } from "@/lib/analytics/client";
import type { Ranked } from "@/lib/search/engine";
import type { Impression } from "@/components/search/results";
import { labelOf } from "@/lib/taxonomy";
import type { DirectoryProvider } from "@/server/directory/data";
import { SaveButton, type Viewer } from "./save-button";

// One search result (Figma S1 "Card Search result"; mobile S5). Clicking the
// card opens the quick look over the results; "See profile" opens the full
// profile in a new tab. Wide cards put price and actions in a side panel,
// narrow ones stack it underneath.

export function ProviderPhoto({ p, className }: { p: DirectoryProvider; className?: string }) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden bg-warm-100", className)}>
      {p.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photoUrl} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <UserRoundIcon aria-hidden className="size-1/2 text-warm-300" />
      )}
    </span>
  );
}

/** The verified seal next to a provider's name (every listed provider is
 *  verified). Kept outside the name's heading, so the heading is the name. */
export function VerifiedMark({ className }: { className?: string }) {
  return <VerifiedSealIcon role="img" aria-label="Verified" aria-hidden={false} className={cn("size-4 shrink-0 text-blue-600", className)} />;
}

/** Figma's credentials mark, before the title line. */
function CredentialsMark({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/how-it-works/verified-check-icon.svg" alt="" className={cn("size-4 shrink-0", className)} />;
}

function TrustLines({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5 text-[13px] leading-[18px] text-warm-900/70", className)}>
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
  );
}

export function ProviderCard({
  ranked,
  viewer,
  onOpen,
  impression,
}: {
  ranked: Ranked;
  viewer: Viewer;
  onOpen: () => void;
  /** Report when the card is seen (search analytics). */
  impression?: Impression;
}) {
  const p = ranked.provider;
  const seenRef = useImpression(p.publicId, impression?.term, impression?.key ?? "");
  const name = displayName(p);
  const first = shortName(p);
  const fee = feeFrom(p);
  const type = therapyType(p.sessionParticipants);
  const place = ranked.where ?? locationLabel(p);
  const about = (p.about ?? "").split(/\n\s*\n/)[0];
  // Specialties that match the search come first, filled (Figma S1).
  const specialties = [...(p.specialties ?? [])].sort((a, b) => Number(ranked.matched.includes(b)) - Number(ranked.matched.includes(a)));
  const shown = specialties.slice(0, 4);
  const more = specialties.length - shown.length;

  const placeChip = place && (
    <span className={cn(pill, "shrink-0", topicChipIdle)}>
      {place.startsWith("Online") ? <MonitorIcon className="size-3.5" /> : <MapPinIcon className="size-3.5" />}
      {place}
    </span>
  );

  const aboutBox = about && (
    <div className={cn(frameColumn, "flex flex-col gap-1.5 p-4")}>
      <p className="text-[13px] leading-[18px] font-medium text-warm-900">About {first}</p>
      <p className="line-clamp-3 text-[13px] leading-5 text-warm-900/70">{about}</p>
      <span className="w-fit text-[13px] leading-[18px] text-warm-900 underline underline-offset-2">View more</span>
    </div>
  );

  const chips = (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <span key={s} className={cn(pill, ranked.matched.includes(s) ? topicChipOn : topicChipIdle)}>
          {labelOf("specialties", s)}
        </span>
      ))}
      {more > 0 && <span className="inline-flex items-center px-1 text-[13px] text-warm-900/60">+{more} more</span>}
      {p.languages?.length ? (
        <span className={cn(pill, topicChipIdle)}>
          <GlobeIcon className="size-3.5" />
          {p.languages.slice(0, 2).join(", ")}
          {p.languages.length > 2 ? ` +${p.languages.length - 2}` : ""}
        </span>
      ) : null}
    </div>
  );

  return (
    // The landing's privacy promise layers: a grey frame, the white card 7px
    // in, and the price in a grey column 7px in again. Hover greys the frame.
    <article
      ref={seenRef}
      className={cn("@container group relative transition-colors duration-200 hover:bg-warm-900/[0.07] has-[>button:active]:bg-warm-900/10", frame)}
      data-testid="provider-card"
    >
      {/* The whole card opens the quick look; links and buttons sit above it. */}
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={`Preview ${name}`}
        className="absolute inset-0 z-0 rounded-[20px] focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none"
      />

      {/* Clicks fall through to the card button, except on the actions. */}
      <div className={cn(frameCard, "pointer-events-none relative grid transition-colors duration-200 group-hover:bg-warm-50 @3xl:grid-cols-[minmax(0,1fr)_250px]")}>
        <div className="flex min-w-0 flex-col gap-3 p-3 @lg:p-4">
          {ranked.misses?.length ? (
            // TODO(client): copy.
            <p className="flex w-fit items-center gap-1.5 rounded-tag bg-amber-50 px-2.5 py-1 type-caption font-medium text-amber-800">
              <SparklesIcon className="size-3.5" />
              Close match · {ranked.misses.join(" · ")}
            </p>
          ) : null}

          <div className="flex gap-3 @lg:gap-4">
            <span className="flex size-20 shrink-0 rounded-[10px] border border-warm-900/[0.08] bg-white p-1 @lg:size-[132px] @3xl:size-36">
              <ProviderPhoto p={p} className="size-full rounded-[6px]" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3 @lg:gap-4">
              {/* Name, then the title, then where: each on its own line, so a
                  long title never runs into the place. */}
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base leading-6 font-medium tracking-[-0.01em] text-warm-900 @lg:text-lg">{name}</h3>
                  <VerifiedMark />
                </div>
                <p className="flex items-start gap-1.5 text-[13px] leading-5 text-warm-900/60 @lg:text-sm">
                  <CredentialsMark className="mt-0.5 size-3.5 @lg:size-4" />
                  <span>{p.titleCredentials}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {placeChip}
                  {p.acceptingNewClients === false && (
                    <span className={cn(pill, "border-amber-200 bg-amber-50 text-amber-800 shadow-none")}>Not accepting new clients</span>
                  )}
                </div>
              </div>
              <div className="hidden flex-col gap-3 @lg:flex">
                {aboutBox}
                {chips}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 @lg:hidden">
            {aboutBox}
            {chips}
          </div>
        </div>

        {/* Figma's grey panel: price, therapy type, actions, trust lines. */}
        <div className={cn(frameColumn, "relative m-1.5 mt-0 flex flex-col justify-between gap-4 p-4 @3xl:mt-1.5 @3xl:ml-0")}>
          <dl className="grid grid-cols-2 gap-3 @3xl:grid-cols-1">
            <div className="flex flex-col gap-1">
              <dt className="text-[13px] leading-[18px] text-warm-900/60">Price per session</dt>
              <dd className="text-sm leading-5 text-warm-900">
                {fee != null ? (
                  <>
                    From <span className="font-medium">{fee} USD</span>
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[13px] leading-[18px] text-warm-900/60">Therapy type</dt>
              <dd className="text-sm leading-5 text-warm-900">{type ?? "—"}</dd>
            </div>
          </dl>
          <div className="pointer-events-auto relative z-10 flex gap-2 @3xl:flex-col">
            <Button asChild variant="brand" className="h-10 flex-1 text-sm @3xl:flex-none">
              <a href={p.href} target="_blank" rel="noopener">
                See profile
                <CtaArrowIcon />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
            <SaveButton
              profileId={p.id}
              name={first}
              initialSaved={false}
              viewer={viewer}
              returnTo={p.href}
              variant="full"
              labels={{ save: "Save", saved: "Saved" }}
              className="h-10 flex-1 text-sm @3xl:flex-none"
            />
          </div>
          <TrustLines className="border-t border-warm-900/10 pt-4" />
        </div>
      </div>
    </article>
  );
}
