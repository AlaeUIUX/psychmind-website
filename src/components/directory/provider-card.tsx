"use client";

import { cn } from "cn";
import { ArrowUpRightIcon, GlobeIcon, MapPinIcon, MonitorIcon, UserRoundIcon } from "lucide-react";
import { displayName, feeFrom, locationLabel, shortName, therapyType } from "@/lib/provider/display";
import { labelOf } from "@/lib/taxonomy";
import type { DirectoryProvider } from "@/server/directory/data";
import { SaveButton, type Viewer } from "./save-button";

// One provider in the results (Figma S1 "Card Search result"). The price and
// actions panel sits under the card's content while the quick view takes the
// right-hand side. Selecting the card opens the quick view; "See profile"
// opens the full profile in a new tab.

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

export function ProviderCard({
  p,
  selected,
  onSelect,
  viewer,
}: {
  p: DirectoryProvider;
  selected: boolean;
  onSelect: () => void;
  viewer: Viewer;
}) {
  const name = displayName(p);
  const first = shortName(p);
  const fee = feeFrom(p);
  const type = therapyType(p.sessionParticipants);
  const location = locationLabel(p);
  const about = (p.about ?? "").split(/\n\s*\n/)[0];
  const specialties = [...(p.specialties ?? [])].sort((a, b) => (a === p.primarySpecialty ? -1 : b === p.primarySpecialty ? 1 : 0));
  const shown = specialties.slice(0, 3);
  const more = specialties.length - shown.length;

  return (
    <article
      className={cn(
        "@container group relative rounded-card border bg-white p-3 transition-[border-color,box-shadow] duration-200",
        selected ? "border-warm-900 shadow-[0_0_0_1px_var(--color-warm-900)]" : "border-warm-200 hover:border-warm-300 hover:shadow-control",
      )}
      data-testid="provider-card"
    >
      {/* The whole card selects the provider; the controls sit above it. */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Preview ${name}`}
        className="absolute inset-0 z-0 rounded-card focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none"
      />

      <div className="pointer-events-none relative flex gap-3 @lg:gap-4">
        <span className="flex size-[84px] shrink-0 rounded-2xl border border-black/[0.08] bg-white p-1 @lg:size-[132px] @lg:rounded-3xl @lg:p-1.5">
          <ProviderPhoto p={p} className="size-full rounded-xl @lg:rounded-[18px]" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-3 @lg:gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 truncate pt-0.5 type-title-lg font-semibold text-text-primary">{name}</h3>
              <span className="pointer-events-auto relative z-10 -mt-0.5 shrink-0">
                <SaveButton profileId={p.id} name={first} initialSaved={false} viewer={viewer} returnTo={p.href} />
              </span>
            </div>
            <p className="flex min-w-0 items-center gap-2 type-small text-text-tertiary">
              <VerifiedMark />
              <span className="truncate">{p.titleCredentials}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {location && (
                <span className={cn(chip, "border-warm-300 bg-white text-text-secondary")}>
                  {location === "Online" ? <MonitorIcon className="size-3.5" /> : <MapPinIcon className="size-3.5" />}
                  {location}
                </span>
              )}
              {p.acceptingNewClients === false && (
                <span className={cn(chip, "border-amber-200 bg-amber-50 text-amber-800 shadow-none")}>Not accepting new clients</span>
              )}
            </div>
          </div>

          {/* Figma's "About {name}" box; on narrow cards it moves below. */}
          <AboutBox first={first} about={about} className="hidden @lg:flex" />
        </div>
      </div>

      <AboutBox first={first} about={about} className="pointer-events-none relative mt-3 flex @lg:hidden" />

      <div className="pointer-events-none relative mt-3 flex flex-wrap gap-1.5">
        {shown.map((s) => (
          <span
            key={s}
            className={cn(chip, s === p.primarySpecialty ? "border-warm-800 bg-warm-800 text-white" : "border-warm-300 bg-white text-text-secondary")}
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

      {/* Figma's price panel, as a strip under the card. */}
      <div className="relative mt-3 flex items-center justify-between gap-3 rounded-2xl bg-warm-100 px-4 py-3">
        <dl className="pointer-events-none flex min-w-0 flex-wrap gap-x-6 gap-y-1">
          <div className="flex flex-col">
            <dt className="type-caption text-text-tertiary">Price per session</dt>
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
          {type && (
            <div className="flex min-w-0 flex-col">
              <dt className="type-caption text-text-tertiary">Therapy type</dt>
              <dd className="truncate type-small text-text-secondary">{type}</dd>
            </div>
          )}
        </dl>
        <a
          href={p.href}
          target="_blank"
          rel="noopener"
          className="relative z-10 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-field border border-warm-300 bg-white px-3 type-small font-medium text-text-primary shadow-control transition-colors hover:bg-warm-50 focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none"
        >
          See profile
          <ArrowUpRightIcon className="size-4" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
}

function AboutBox({ first, about, className }: { first: string; about: string; className?: string }) {
  if (!about) return null;
  return (
    <div className={cn("flex-col gap-1.5 rounded-2xl bg-warm-100 p-4", className)}>
      <p className="type-small font-medium text-text-primary">About {first}</p>
      <p className="line-clamp-3 type-small text-text-secondary">
        {about}
      </p>
      <span className="w-fit type-small text-text-primary underline underline-offset-2">View more</span>
    </div>
  );
}
