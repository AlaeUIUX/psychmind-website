"use client";

import { cn } from "cn";
import { CheckIcon, FlaskConicalIcon, GlobeIcon, MapPinIcon, MonitorIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatsLabel, ProfileBanner } from "@/components/provider/profile-view";
import { displayName, feeFrom, licensedStates, locationLabel, shortName, therapyType } from "@/lib/provider/display";
import { ageProfileLabel, labelOf, stateName } from "@/lib/taxonomy";
import type { DirectoryProvider } from "@/server/directory/data";
import { RequestSessionButton, VerifiedExplainer } from "./profile-actions";
import { ProviderPhoto } from "./provider-card";
import { SaveButton, type Viewer } from "./save-button";

// A provider at a glance, in the overlay over the search results: enough to
// tell whether they're a good match before opening the full profile.
// Section titles are Figma copy where they exist.

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 border-t border-warm-100 pt-5">
      <h3 className="type-overline text-text-tertiary">{title}</h3>
      {children}
    </section>
  );
}

function Chip({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-tag border px-2 py-0.5 text-[13px] font-medium",
        strong ? "border-warm-900 bg-warm-900 text-white" : "border-warm-200 bg-white text-text-secondary",
      )}
    >
      {children}
    </span>
  );
}

export function QuickView({
  p,
  viewer,
  saved,
  matched = [],
  className,
}: {
  p: DirectoryProvider;
  viewer: Viewer;
  saved: boolean;
  /** Specialties that match the search (highlighted). */
  matched?: string[];
  className?: string;
}) {
  const name = displayName(p);
  const first = shortName(p);
  const fee = feeFrom(p);
  const type = therapyType(p.sessionParticipants);
  const formats = formatsLabel(Array.from(new Set((p.locations ?? []).flatMap((l) => l.formats))));
  const location = locationLabel(p);
  const states = licensedStates(p);
  const highlight = matched.length ? matched : p.primarySpecialty ? [p.primarySpecialty] : [];
  const specialties = [...(p.specialties ?? [])].sort((a, b) => Number(highlight.includes(b)) - Number(highlight.includes(a)));
  const who = [...(p.sessionParticipants ?? []).map((v) => labelOf("participants", v)), ...(p.ageGroups ?? []).map(ageProfileLabel)];

  return (
    <div key={p.id} className={cn("flex animate-focus-in flex-col", className)}>
      <div className="relative px-4 pt-4 sm:px-5 sm:pt-5">
        <ProfileBanner style={p.bannerStyle} className="h-28 rounded-xl" />
        <ProviderPhoto p={p} className="absolute top-14 left-8 size-24 rounded-2xl border-4 border-white shadow-card sm:left-9" />
      </div>

      <div className="flex flex-col gap-5 px-5 pt-3 pb-6 sm:px-7">
        <div className="flex justify-end">
          <VerifiedExplainer name={first} states={states} />
        </div>
        <header className="-mt-1 flex flex-col gap-1.5">
          <h2 className="text-[24px] leading-8 font-semibold tracking-[-0.015em] text-text-primary">{name}</h2>
          <p className="type-body text-text-secondary">
            {p.titleCredentials}
            {p.pronouns && <span className="text-text-tertiary"> · {p.pronouns}</span>}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {formats && (
              <Chip>
                <MonitorIcon className="size-3.5" />
                {formats}
              </Chip>
            )}
            {location && location !== "Online" && (
              <Chip>
                <MapPinIcon className="size-3.5" />
                {location}
              </Chip>
            )}
            {p.acceptingNewClients === false && (
              <span className="inline-flex items-center rounded-tag bg-amber-50 px-2 py-0.5 text-[13px] font-medium text-amber-800">Not accepting new clients</span>
            )}
            {p.isSample && (
              <span className="inline-flex items-center gap-1 rounded-tag bg-warm-100 px-2 py-0.5 text-[13px] font-medium text-text-tertiary">
                <FlaskConicalIcon className="size-3.5" />
                Sample profile
              </span>
            )}
          </div>
        </header>

        <div className="flex gap-2">
          <RequestSessionButton
            provider={{ id: p.id, name: first, bannerStyle: p.bannerStyle, isSample: p.isSample, acceptingNewClients: p.acceptingNewClients }}
            viewer={viewer}
            saved={saved}
            returnTo={p.href}
            className="h-11 flex-1"
          />
          <SaveButton profileId={p.id} name={first} initialSaved={saved} viewer={viewer} returnTo={p.href} className="size-11" />
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-warm-50 p-4 ring-1 ring-warm-100 ring-inset">
          <div className="flex flex-col gap-0.5">
            <dt className="type-caption text-text-tertiary">Price per session</dt>
            <dd className="type-small text-text-primary">
              {fee != null ? (
                <>
                  From <span className="font-semibold">{fee} USD</span>
                </>
              ) : (
                "—"
              )}
            </dd>
            {p.slidingScale && <dd className="type-caption text-text-tertiary">Sliding scale available</dd>}
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="type-caption text-text-tertiary">Therapy type</dt>
            <dd className="type-small text-text-primary">{type ?? "—"}</dd>
          </div>
        </dl>

        <Block title="Who I work with">
          <p className="line-clamp-5 type-small text-text-secondary">{(p.whoYouWorkWith ?? "").split(/\n\s*\n/)[0]}</p>
          {who.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {who.map((w) => (
                <Chip key={w}>{w}</Chip>
              ))}
            </div>
          )}
        </Block>

        <Block title="Specialties">
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((s) => (
              <Chip key={s} strong={highlight.includes(s)}>
                {labelOf("specialties", s)}
              </Chip>
            ))}
          </div>
        </Block>

        {p.approaches?.length || p.languages?.length ? (
          <Block title="Approach & languages">
            <div className="flex flex-wrap gap-1.5">
              {(p.approaches ?? []).map((a) => (
                <Chip key={a}>{labelOf("approaches", a)}</Chip>
              ))}
            </div>
            {p.languages?.length ? (
              <p className="flex items-center gap-1.5 type-small text-text-secondary">
                <GlobeIcon className="size-4 text-text-tertiary" />
                {p.languages.join(", ")}
              </p>
            ) : null}
          </Block>
        ) : null}

        {states.length > 0 && (
          <Block title="Licensed in">
            <ul className="flex flex-col gap-1.5">
              {(p.licenses ?? []).map((l) => (
                <li key={l.state} className="flex items-center gap-2 type-small text-text-secondary">
                  <CheckIcon className="size-4 shrink-0 text-emerald-600" />
                  <span className="text-text-primary">{stateName(l.state)}</span>
                  <span className="truncate text-text-tertiary">· License #{l.licenseNumber}</span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        <div className="flex flex-col gap-2.5 border-t border-warm-100 pt-5 type-small text-text-secondary">
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
    </div>
  );
}
