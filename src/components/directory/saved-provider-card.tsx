"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { displayName, feeFrom, locationLabel, shortName, therapyType } from "@/lib/provider/display";
import type { DirectoryProvider, UnavailableProvider } from "@/server/directory/data";
import { ProviderPhoto, VerifiedMark } from "./provider-card";
import { SaveButton } from "./save-button";
import { CtaArrowIcon, UserRoundIcon } from "@/components/ui/hugeicons";
import { Badge } from "@/components/ui/badge";

// A saved provider on the patient's account page (Figma V1, "Saved" variant):
// the profile opens in a new tab; "Saved" un-saves, with Undo.
export function SavedProviderCard({ p }: { p: DirectoryProvider }) {
  const name = displayName(p);
  const fee = feeFrom(p);
  const type = therapyType(p.sessionParticipants);
  const location = locationLabel(p);

  return (
    <article className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-4 shadow-control sm:p-5" data-testid="saved-provider">
      <div className="flex items-start gap-3">
        <ProviderPhoto p={p} className="size-14 rounded-xl border border-black/[0.08]" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="flex items-center gap-1.5">
            <span className="truncate type-ui-heading text-text-primary">{name}</span>
            <VerifiedMark />
          </p>
          <p className="truncate type-ui-small text-text-secondary">{p.titleCredentials}</p>
          {location && <p className="truncate type-ui-small text-text-tertiary">{location}</p>}
        </div>
      </div>

      {p.whoYouWorkWith && <p className="line-clamp-3 type-ui-body text-text-secondary">{p.whoYouWorkWith}</p>}

      <div className="mt-auto flex flex-col gap-3">
        <dl className="grid grid-cols-2 gap-3 rounded-field bg-warm-50 p-3 ring-1 ring-warm-100 ring-inset">
          <div className="flex flex-col gap-0.5">
            <dt className="type-ui-caption text-text-tertiary">Price per session</dt>
            <dd className="type-ui-small text-text-primary">
              {fee != null ? (
                <>
                  From <span className="font-medium">{fee} USD</span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="type-ui-caption text-text-tertiary">Therapy type</dt>
            <dd className="type-ui-small text-text-primary">{type ?? "—"}</dd>
          </div>
        </dl>
        <div className="flex gap-2">
          <Button asChild variant="secondary" className="h-10 flex-1">
            <a href={p.href} target="_blank" rel="noopener">
              See profile
              <CtaArrowIcon />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
          <SaveButton profileId={p.id} name={shortName(p)} initialSaved viewer={{ role: "patient" }} returnTo={p.href} variant="full" className="flex-1" />
        </div>
      </div>
    </article>
  );
}

// A saved provider who has left the directory for now (paused, unpaid,
// suspended): kept on the list so the patient doesn't lose them, with only
// their name and title, and "Saved" still un-saves. TODO(client): copy.
export function UnavailableSavedCard({ p }: { p: UnavailableProvider }) {
  return (
    <article className="flex flex-col gap-4 rounded-card border border-warm-200 bg-warm-50 p-4 sm:p-5" data-testid="saved-provider-unavailable">
      <div className="flex items-start gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-warm-100">
          <UserRoundIcon aria-hidden className="size-7 text-warm-300" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate type-ui-heading text-text-secondary">{displayName(p)}</span>
          {p.titleCredentials && <p className="truncate type-ui-small text-text-tertiary">{p.titleCredentials}</p>}
          <Badge variant="neutral" className="mt-1 w-fit">
            Currently unavailable
          </Badge>
        </div>
      </div>
      <p className="type-ui-body text-text-secondary">
        {shortName(p)} isn&apos;t taking requests on PsychMind right now. We&apos;ll keep the profile on your list in case it comes back.
      </p>
      <div className="mt-auto flex gap-2">
        <Button asChild variant="secondary" className="h-10 flex-1">
          <Link href="/providers">Browse providers</Link>
        </Button>
        <SaveButton profileId={p.id} name={shortName(p)} initialSaved viewer={{ role: "patient" }} returnTo="/account" variant="full" className="flex-1" />
      </div>
    </article>
  );
}
