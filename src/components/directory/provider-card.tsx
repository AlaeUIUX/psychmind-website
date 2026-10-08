"use client";

import { cn } from "cn";
import { ArrowUpRightIcon, GlobeIcon, MapPinIcon, MonitorIcon, SparklesIcon, UserRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { displayName, feeFrom, locationLabel, shortName, therapyType } from "@/lib/provider/display";
import type { Ranked } from "@/lib/search/engine";
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

export function VerifiedMark({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/how-it-works/verified-check-icon.svg" alt="Verified" className={cn("size-4 shrink-0", className)} />;
}

const chip = "inline-flex items-center gap-1 rounded-tag border px-2.5 py-1 text-sm font-medium shadow-control";

function TrustLines({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5 type-small text-text-secondary", className)}>
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

export function ProviderCard({ ranked, viewer, onOpen }: { ranked: Ranked; viewer: Viewer; onOpen: () => void }) {
  const p = ranked.provider;
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
    <span className={cn(chip, "shrink-0 border-warm-300 bg-white text-text-secondary")}>
      {place.startsWith("Online") ? <MonitorIcon className="size-3.5" /> : <MapPinIcon className="size-3.5" />}
      {place}
    </span>
  );

  const aboutBox = about && (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-warm-100 p-4">
      <p className="type-small font-medium text-text-primary">About {first}</p>
      <p className="line-clamp-3 type-small text-text-secondary">{about}</p>
      <span className="w-fit type-small text-text-primary underline underline-offset-2">View more</span>
    </div>
  );

  const chips = (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <span
          key={s}
          className={cn(chip, ranked.matched.includes(s) ? "border-warm-800 bg-warm-800 text-white" : "border-warm-300 bg-white text-text-secondary")}
        >
          {labelOf("specialties", s)}
        </span>
      ))}
      {more > 0 && <span className="inline-flex items-center px-1 text-sm text-text-tertiary">+{more} more</span>}
      {p.languages?.length ? (
        <span className={cn(chip, "border-warm-300 bg-white text-text-secondary")}>
          <GlobeIcon className="size-3.5" />
          {p.languages.slice(0, 2).join(", ")}
          {p.languages.length > 2 ? ` +${p.languages.length - 2}` : ""}
        </span>
      ) : null}
    </div>
  );

  return (
    <article
      className="@container group relative rounded-card border border-warm-200 bg-white p-3 transition-colors duration-200 hover:border-warm-300 hover:bg-warm-50 has-[>button:active]:bg-warm-100"
      data-testid="provider-card"
    >
      {/* The whole card opens the quick look; links and buttons sit above it. */}
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={`Preview ${name}`}
        className="absolute inset-0 z-0 rounded-card focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none"
      />

      {ranked.misses?.length ? (
        // TODO(client): copy.
        <p className="pointer-events-none relative mb-3 flex w-fit items-center gap-1.5 rounded-tag bg-amber-50 px-2.5 py-1 type-caption font-medium text-amber-800">
          <SparklesIcon className="size-3.5" />
          Close match · {ranked.misses.join(" · ")}
        </p>
      ) : null}

      {/* Clicks fall through to the card button, except on the actions. */}
      <div className="pointer-events-none relative flex flex-col gap-3 @3xl:flex-row @3xl:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex gap-3 @lg:gap-4">
            <span className="flex size-20 shrink-0 rounded-2xl border border-black/[0.08] bg-white p-1 @lg:size-[132px] @lg:rounded-3xl @lg:p-1.5 @3xl:size-40">
              <ProviderPhoto p={p} className="size-full rounded-xl @lg:rounded-[18px]" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3 @lg:gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 pt-0.5 type-title-lg font-semibold text-text-primary">{name}</h3>
                  <span className="hidden @lg:inline-flex">{placeChip}</span>
                </div>
                <p className="flex min-w-0 items-start gap-2 type-small text-text-tertiary @lg:type-body">
                  <VerifiedMark className="mt-0.5 @lg:mt-1" />
                  <span>{p.titleCredentials}</span>
                </p>
                <span className="mt-1 @lg:hidden">{placeChip}</span>
                {p.acceptingNewClients === false && (
                  <span className={cn(chip, "mt-1 w-fit border-amber-200 bg-amber-50 text-amber-800 shadow-none")}>Not accepting new clients</span>
                )}
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
        <div className="relative flex flex-col justify-between gap-4 rounded-2xl bg-warm-100 p-4 @3xl:w-[250px] @3xl:shrink-0">
          <dl className="grid grid-cols-2 gap-3 @3xl:grid-cols-1">
            <div className="flex flex-col gap-1">
              <dt className="type-small text-text-primary">Price per session</dt>
              <dd className="type-small text-text-secondary">
                {fee != null ? (
                  <>
                    From <span className="font-medium text-text-primary">{fee} USD</span>
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="type-small text-text-primary">Therapy type</dt>
              <dd className="type-small text-text-secondary">{type ?? "—"}</dd>
            </div>
          </dl>
          <div className="pointer-events-auto relative z-10 flex gap-2 @3xl:flex-col">
            <Button asChild variant="brand" className="h-10 flex-1 text-sm @3xl:flex-none">
              <a href={p.href} target="_blank" rel="noopener">
                See profile
                <ArrowUpRightIcon />
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
          <TrustLines className="border-t border-warm-200 pt-4" />
        </div>
      </div>
    </article>
  );
}
