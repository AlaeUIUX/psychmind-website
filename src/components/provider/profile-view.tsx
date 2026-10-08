import { cn } from "cn";
import { BuildingIcon, HeartIcon, MapPinIcon, MonitorIcon, UserRoundIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Tag, VerifiedBadge } from "@/components/ui/tag";
import { displayName, listJoin } from "@/lib/provider/display";
import type { PreviewRegion } from "@/lib/provider/steps";
import type { ProfileView as ProfileData } from "@/lib/provider/types";
import {
  SPECIALTY_CATEGORIES,
  ageProfileLabel,
  bannerColor,
  bannerCta,
  labelOf,
  specialtyCategory,
  stateName,
} from "@/lib/taxonomy";

// The provider profile, driven by data. Used as the live preview while a
// provider onboards or edits, and as the public profile page. Layout
// and styling follow the "Profiles" showcase on How it works (Figma D2).

/** A part of the profile the editor can point at ("you're editing this"). */
function Region({ name, highlight, className, children }: { name: PreviewRegion; highlight?: PreviewRegion | null; className?: string; children: ReactNode }) {
  const on = highlight === name;
  return (
    <div
      data-region={name}
      data-active={on || undefined}
      className={cn(
        "relative rounded-lg transition-[box-shadow,background-color] duration-500 ease-out-soft",
        on && "bg-blue-50/70 shadow-[0_0_0_6px_rgb(239_246_255),0_0_0_7px_rgb(96_165_250)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Section({ title, region, highlight, children }: { title: string; region: PreviewRegion; highlight?: PreviewRegion | null; children: ReactNode }) {
  return (
    <>
      <hr className="border-warm-200" />
      <Region name={region} highlight={highlight}>
      <section className="flex flex-col gap-3">
        <h3 className="type-small font-medium text-text-primary">{title}</h3>
        {children}
      </section>
      </Region>
    </>
  );
}

function Paragraphs({ text, placeholder }: { text?: string; placeholder: string }) {
  const parts = (text ?? "").split(/\n\s*\n|\n/).filter((p) => p.trim());
  if (!parts.length) return <p className="type-small text-text-placeholder italic">{placeholder}</p>;
  return (
    <div className="flex flex-col gap-2">
      {parts.map((p, i) => (
        <p key={i} className="type-small whitespace-pre-line text-text-secondary">
          {p}
        </p>
      ))}
    </div>
  );
}

/** Empty chip outline, like Figma's preview placeholders. */
function GhostTag() {
  return <span aria-hidden className="inline-block h-7 w-20 rounded-tag border border-dashed border-warm-300" />;
}

export function formatsLabel(formats: string[]) {
  const online = formats.includes("online");
  const inPerson = formats.includes("in_person");
  if (online && inPerson) return "Online & in-person";
  if (online) return "Online";
  if (inPerson) return "In-person";
  return null;
}

export function ProfileBanner({ style, className }: { style?: string | null; className?: string }) {
  const color = bannerColor(style);
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ backgroundColor: color }}>
      {/* The how-it-works brush texture, centred on mid-grey and soft-lit, so
          it adds strokes without shifting the colour (the banner matches the
          "Request a session" button exactly). */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('/images/how-it-works/profile-banner.png')] bg-cover bg-center mix-blend-soft-light [filter:grayscale(1)_brightness(0.58)_contrast(2.2)]"
      />
    </div>
  );
}

type ProfileViewProps = {
  profile: ProfileData;
  /** "preview" (onboarding, dashboard, admin): a card with a Preview badge and
   *  placeholder hints for unfilled sections. "public": the profile page
   *  (Figma P1), laid flat on the page's own panel. */
  mode?: "preview" | "public";
  /** Action buttons for the sidebar (Request a session…). Previews pass inert stand-ins. */
  actions?: ReactNode;
  /** Ring the part of the profile currently being edited. */
  highlight?: PreviewRegion | null;
  /** Public page: replaces the plain "Verified" chip (e.g. with an explainer). */
  verifiedSlot?: ReactNode;
  /** Public page: the button on the banner's corner (Figma "Go back to results"). */
  bannerAction?: ReactNode;
  className?: string;
};

/** `tail` stays on one line (a license number shouldn't break). */
type CredentialLine = { text: string; tail?: string; tone?: "strong" | "note"; verified?: boolean };

export function ProviderProfileView({ profile: p, mode = "public", actions, highlight, verifiedSlot, bannerAction, className }: ProfileViewProps) {
  const preview = mode === "preview";
  const name = displayName(p) || (preview ? "Full name" : "");
  const locations = p.locations ?? [];
  const formats = Array.from(new Set(locations.flatMap((l) => l.formats)));
  const formatText = formatsLabel(formats);
  const primary = locations.find((l) => l.isPrimary) ?? locations[0];
  const licensedIn = Array.from(new Set((p.licenses ?? []).filter((l) => l.verified).map((l) => stateName(l.state))));
  const firstName = p.displayAsBusiness && p.businessName ? p.businessName : p.firstName;

  const groups = SPECIALTY_CATEGORIES.map((cat) => ({
    ...cat,
    items: (p.specialties ?? []).filter((s) => specialtyCategory(s) === cat.value),
  })).filter((g) => g.items.length);

  const whoChips = [
    ...(p.sessionParticipants ?? []).map((v) => labelOf("participants", v)),
    ...(p.ageGroups ?? []).map(ageProfileLabel),
  ];

  const strong = (text: string): CredentialLine[] => (text ? [{ text, tone: "strong" }] : []);
  const credentials: { label: string; lines: CredentialLine[] }[] = [
    {
      label: "License",
      lines: p.licenses?.length
        ? [
            ...strong(p.titleCredentials ?? ""),
            ...p.licenses.flatMap((l): CredentialLine[] => [
              {
                text: `${l.verified ? "Verified by PsychMind · " : ""}${stateName(l.state)} · `,
                tail: `License #${l.licenseNumber}`,
                verified: l.verified,
              },
              ...(l.issuingBody ? [{ text: l.issuingBody, tone: "note" as const }] : []),
            ]),
          ]
        : [],
    },
    {
      label: "Education",
      lines: (p.education ?? []).flatMap((e) => [...strong(e.degree), { text: [e.school, e.year].filter(Boolean).join(" · ") }]),
    },
    { label: "Experience", lines: p.yearsExperience != null ? strong(`${p.yearsExperience} years in practice`) : [] },
    { label: "Languages", lines: strong(p.languages?.join(", ") ?? "") },
    { label: "Approaches", lines: strong((p.approaches ?? []).map((a) => labelOf("approaches", a)).join(" · ")) },
    { label: "Session types", lines: strong((p.sessionParticipants ?? []).map((v) => labelOf("participants", v)).join(" · ")) },
  ].filter((c) => c.lines.length || preview);

  return (
    <article
      className={cn(
        "@container relative w-full",
        preview && "overflow-clip rounded-card bg-warm-50 shadow-card ring-1 ring-warm-200",
        className,
      )}
    >
      <Region name="banner" highlight={highlight} className={preview ? "rounded-none" : "rounded-xl"}>
        <ProfileBanner style={p.bannerStyle} className={preview ? "h-24" : "h-24 rounded-xl @3xl:h-34"} />
        {!preview && bannerAction && (
          // Above the photo row, which overlaps the banner's lower edge.
          <div className="absolute right-3 bottom-3 z-10 @3xl:right-6 @3xl:-bottom-3">{bannerAction}</div>
        )}
      </Region>

      <div className={cn("relative flex items-end justify-between gap-3", preview ? "-mt-14 px-6" : "-mt-12 px-2 @3xl:-mt-22 @3xl:px-6")}>
        <Region name="photo" highlight={highlight} className="rounded-4xl">
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-4xl border-4 border-white bg-warm-100 shadow-card",
            preview ? "size-28" : "size-28 @3xl:size-40 @3xl:border-6",
          )}
        >
          {p.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <UserRoundIcon aria-hidden className="size-10 text-warm-300" />
          )}
        </div>
        </Region>
        {preview && (
          <span className="mb-4 inline-flex h-8 items-center rounded-pill border border-warm-300 bg-white px-3 type-caption font-medium text-warm-800 shadow-control">
            Preview
          </span>
        )}
      </div>

      <div className={cn("relative flex flex-col gap-8 pt-4 pb-6 @3xl:flex-row", preview ? "px-6" : "px-2 @3xl:px-6 @5xl:gap-12")}>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Region name="identity" highlight={highlight} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              {preview ? (
                <h2 className={cn("type-title", name ? "text-text-primary" : "text-text-placeholder")}>{name}</h2>
              ) : (
                <h1 className="type-title-lg font-semibold text-text-primary">{name}</h1>
              )}
              {p.verified ? (
                (verifiedSlot ?? <VerifiedBadge />)
              ) : (
                preview && (
                  <Tag className="shrink-0 border-amber-200 bg-amber-50 text-amber-800">
                    {/* TODO(client): copy */}
                    Pending verification
                  </Tag>
                )
              )}
            </div>
            <p className="flex flex-wrap items-center gap-x-2 type-body text-text-secondary">
              {p.verified && p.titleCredentials && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/how-it-works/check-icon.svg" alt="" className="size-4" />
              )}
              {p.titleCredentials ? (
                <span>{p.titleCredentials}</span>
              ) : (
                preview && <span className="text-text-placeholder">Title / credentials</span>
              )}
              {p.pronouns && <span className="text-text-tertiary">{p.pronouns}</span>}
            </p>
            <Region name="location" highlight={highlight} className="flex flex-wrap gap-1.5">
              {formatText && <Tag>{formatText}</Tag>}
              {primary && (
                <Tag>
                  {primary.city}, {primary.state}
                  {primary.zip ? ` ${primary.zip}` : ""}
                  <MapPinIcon aria-hidden className="ml-0.5 size-3.5" />
                </Tag>
              )}
              {!formatText && !primary && preview && <GhostTag />}
              {p.acceptingNewClients === false && <Tag className="text-text-placeholder">Not accepting new clients</Tag>}
            </Region>
          </Region>

          <Section title="Who I work with" region="who" highlight={highlight}>
            <Paragraphs text={p.whoYouWorkWith} placeholder="Who you work with will appear here." />
            <div className="flex flex-wrap gap-1.5">
              {whoChips.length ? whoChips.map((c) => <Tag key={c}>{c}</Tag>) : preview && <><GhostTag /><GhostTag /><GhostTag /></>}
            </div>
          </Section>

          <Section title={firstName ? `About ${firstName}` : "About"} region="about" highlight={highlight}>
            <Paragraphs text={p.about} placeholder="Your story will appear here." />
          </Section>

          {(groups.length > 0 || preview) && (
            <Section title="Specialties" region="specialties" highlight={highlight}>
              {groups.length ? (
                <div className="flex flex-col gap-3">
                  {groups.map((g) => (
                    <div key={g.value} className="flex flex-col gap-2.5">
                      <p className="type-overline text-text-tertiary">{g.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.items.map((s) => (
                          <Tag key={s} className={s === p.primarySpecialty ? "border-warm-800 text-text-primary" : ""}>
                            {labelOf("specialties", s)}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <GhostTag />
                  <GhostTag />
                </div>
              )}
            </Section>
          )}

          {locations.length > 0 && (
            <Section title="Practice locations" region="location" highlight={highlight}>
              <ul className="grid gap-3 @xl:grid-cols-2">
                {locations.map((l, i) => {
                  const inPerson = l.formats.includes("in_person");
                  const Icon = inPerson ? BuildingIcon : MonitorIcon;
                  const license = p.licenses?.find((x) => x.state === l.state);
                  return (
                    <li key={`${l.state}-${l.city}-${i}`} className="flex gap-3 rounded-field border border-warm-200 bg-white p-4 shadow-control">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warm-100 text-text-secondary">
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="type-small font-medium text-text-primary">{l.practiceName || `${l.city}, ${stateName(l.state)}`}</p>
                          {l.isPrimary && locations.length > 1 && (
                            <span className="shrink-0 rounded-tag bg-warm-100 px-1.5 py-0.5 type-caption font-medium text-text-secondary">Primary</span>
                          )}
                        </div>
                        {inPerson && l.address && <p className="type-caption text-text-secondary">{l.address}</p>}
                        <p className="type-caption text-text-tertiary">
                          {l.city}, {l.state}
                          {l.zip ? ` ${l.zip}` : ""}
                          {formatsLabel(l.formats) && ` · ${formatsLabel(l.formats)}`}
                        </p>
                        {license?.verified && (
                          <p className="mt-1.5 flex items-center gap-1.5 type-caption text-text-secondary">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/how-it-works/verified-check-icon.svg" alt="" className="size-3.5" />
                            {/* TODO(client): copy */}
                            {stateName(l.state)} license verified
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          <Section title="Credentials & qualifications" region="credentials" highlight={highlight}>
            {/* Figma P1: label column, values in a fixed column (stacked on phones). */}
            <dl className="flex flex-col gap-6">
              {credentials.map((c) => (
                <div key={c.label} className="flex flex-col gap-2 @md:flex-row @md:items-start @md:justify-between @md:gap-6">
                  <dt className="type-overline shrink-0 text-text-tertiary">{c.label}</dt>
                  <dd className="flex w-full flex-col gap-1.5 @md:max-w-[341px]">
                    {c.lines.some((l) => l.text) ? (
                      c.lines
                        .filter((l) => l.text)
                        .map((line, i) => (
                          <p
                            key={`${line.text}-${i}`}
                            className={cn(
                              "flex items-start gap-1.5",
                              line.tone === "strong"
                                ? "type-small font-medium text-text-primary"
                                : line.tone === "note"
                                  ? "type-caption text-text-tertiary"
                                  : "type-small text-text-secondary",
                            )}
                          >
                            {line.verified && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src="/images/how-it-works/verified-check-icon.svg" alt="" className="mt-0.5 size-4 shrink-0" />
                            )}
                            <span>
                              {line.text}
                              {line.tail && <span className="whitespace-nowrap">{line.tail}</span>}
                            </span>
                          </p>
                        ))
                    ) : (
                      <span aria-hidden className="h-3 w-28 rounded-pill bg-warm-200" />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>

        <aside
          className={cn(
            "flex h-fit w-full shrink-0 flex-col gap-6 rounded-field border border-warm-200 bg-warm-100 p-6 @3xl:w-[300px]",
            // The public page keeps price and actions in view while reading.
            !preview && "@3xl:sticky @3xl:top-24 @5xl:w-[400px] @5xl:p-8",
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-field border border-black/[0.08] bg-white">
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photoUrl} alt="" className="size-full object-cover" />
              ) : (
                <UserRoundIcon aria-hidden className="size-6 text-warm-300" />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate type-small font-medium text-text-primary">{name}</p>
              <p className="truncate type-small text-text-secondary">{p.titleCredentials}</p>
            </div>
          </div>

          {(p.feeIndividual != null || p.feeCouples != null || p.slidingScale || preview) && (
            <>
              <hr className="border-warm-200" />
              <Region name="fees" highlight={highlight}>
              <dl className="flex flex-col gap-2.5">
                {p.feeIndividual != null && (
                  <div className="flex items-center justify-between">
                    <dt className="type-overline text-text-tertiary">Individual session</dt>
                    <dd className="type-small text-text-primary">{p.feeIndividual} USD</dd>
                  </div>
                )}
                {p.feeCouples != null && (
                  <div className="flex items-center justify-between">
                    <dt className="type-overline text-text-tertiary">Couples session</dt>
                    <dd className="type-small text-text-primary">{p.feeCouples} USD</dd>
                  </div>
                )}
                {p.slidingScale && <p className="type-caption text-text-tertiary">Sliding scale available</p>}
                {p.feeIndividual == null && p.feeCouples == null && !p.slidingScale && (
                  <div className="flex items-center justify-between">
                    <dt className="type-overline text-text-tertiary">Session fees</dt>
                    <dd aria-hidden className="h-3 w-16 rounded-pill bg-warm-200" />
                  </div>
                )}
              </dl>
              </Region>
            </>
          )}

          <hr className="border-warm-200" />
          <div className="flex flex-col gap-3">
            {formatText && (
              <p className="flex items-center gap-2 type-small text-text-secondary">
                <MonitorIcon aria-hidden className="size-4 shrink-0" />
                {formatText} available
              </p>
            )}
            {licensedIn.length > 0 && (
              <p className="flex items-start gap-2 type-small text-text-secondary">
                <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                {/* TODO(client): copy */}
                <span>Licensed in {listJoin(licensedIn)}</span>
              </p>
            )}
            {actions ?? (
              <>
                {/* The provider's banner colour is their call-to-action colour. */}
                <span aria-hidden className="flex h-10 items-center justify-center rounded-field type-small font-semibold shadow-control" style={bannerCta(p.bannerStyle)}>
                  Request a session
                </span>
                <span aria-hidden className="flex h-10 items-center justify-center gap-1.5 rounded-field border border-warm-300 bg-white type-small font-medium text-warm-800 shadow-control">
                  <HeartIcon className="size-4" />
                  Save profile
                </span>
              </>
            )}
          </div>

          <hr className="border-warm-200" />
          {/* Trust lines and icons from Figma. */}
          <div className="flex flex-col gap-3 type-small text-text-secondary">
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
        </aside>
      </div>
    </article>
  );
}
