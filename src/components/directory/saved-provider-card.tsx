"use client";

import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { displayName, feeFrom, locationLabel, shortName, therapyType } from "@/lib/provider/display";
import type { DirectoryProvider } from "@/server/directory/data";
import { ProviderPhoto, VerifiedMark } from "./provider-card";
import { SaveButton } from "./save-button";

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
                  From <span className="font-semibold">{fee} USD</span>
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
              <ArrowUpRightIcon />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
          <SaveButton profileId={p.id} name={shortName(p)} initialSaved viewer={{ role: "patient" }} returnTo={p.href} variant="full" className="flex-1" />
        </div>
      </div>
    </article>
  );
}
