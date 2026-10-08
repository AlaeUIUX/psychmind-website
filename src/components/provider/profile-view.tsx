import { cn } from "cn";
import { HeartIcon, MapPinIcon, MonitorIcon, ShieldIcon, UserRoundIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Tag, VerifiedBadge } from "@/components/ui/tag";
import type { PreviewRegion } from "@/lib/provider/steps";
import type { ProfileView as ProfileData } from "@/lib/provider/types";
import {
  BANNER_STYLES,
  SPECIALTY_CATEGORIES,
  ageProfileLabel,
  labelOf,
  specialtyCategory,
  stateName,
} from "@/lib/taxonomy";

// The provider profile, driven by data. Used as the live preview while a
// provider onboards or edits, and (later) as the public profile page. Layout
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
        on && "bg-brand-soft/60 shadow-[0_0_0_6px_var(--color-brand-soft),0_0_0_7px_rgb(192_16_72/0.35)]",
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

export function displayName(p: ProfileData) {
  if (p.displayAsBusiness && p.businessName) return p.businessName;
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
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
  const color = BANNER_STYLES.find((b) => b.value === style)?.color ?? BANNER_STYLES[3].color;
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ backgroundColor: color }}>
      {/* The how-it-works banner texture, tinted by the chosen colour. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('/images/how-it-works/profile-banner.png')] bg-cover bg-center opacity-60 mix-blend-luminosity grayscale"
      />
    </div>
  );
}

type ProfileViewProps = {
  profile: ProfileData;
  /** "preview" adds a badge and placeholder hints for unfilled sections. */
  mode?: "preview" | "public";
  /** Action buttons for the sidebar (Request a session…). Previews pass inert stand-ins. */
  actions?: ReactNode;
  /** Ring the part of the profile currently being edited. */
  highlight?: PreviewRegion | null;
  className?: string;
};

export function ProviderProfileView({ profile: p, mode = "public", actions, highlight, className }: ProfileViewProps) {
  const preview = mode === "preview";
  const name = displayName(p) || (preview ? "Full name" : "");
  const formats = Array.from(new Set((p.locations ?? []).flatMap((l) => l.formats)));
  const formatText = formatsLabel(formats);
  const primary = (p.locations ?? []).find((l) => l.isPrimary) ?? p.locations?.[0];
  const firstName = p.displayAsBusiness && p.businessName ? p.businessName : p.firstName;

  const groups = SPECIALTY_CATEGORIES.map((cat) => ({
    ...cat,
    items: (p.specialties ?? []).filter((s) => specialtyCategory(s) === cat.value),
  })).filter((g) => g.items.length);

  const whoChips = [
    ...(p.sessionParticipants ?? []).map((v) => labelOf("participants", v)),
    ...(p.ageGroups ?? []).map(ageProfileLabel),
  ];

  const credentials = [
    {
      label: "License",
      lines: p.licenses?.length
        ? [
            p.titleCredentials ?? "",
            ...p.licenses.map(
              (l) => `${l.verified ? "Verified by PsychMind · " : ""}${stateName(l.state)} · License #${l.licenseNumber}`,
            ),
          ]
        : [],
    },
    {
      label: "Education",
      lines: (p.education ?? []).flatMap((e) => [e.degree, [e.school, e.year].filter(Boolean).join(" · ")]),
    },
    { label: "Experience", lines: p.yearsExperience != null ? [`${p.yearsExperience} years in practice`] : [] },
    { label: "Languages", lines: p.languages?.length ? [p.languages.join(", ")] : [] },
    {
      label: "Approaches",
      lines: p.approaches?.length ? [p.approaches.map((a) => labelOf("approaches", a)).join(" · ")] : [],
    },
    {
      label: "Session types",
      lines: p.sessionParticipants?.length
        ? [p.sessionParticipants.map((v) => labelOf("participants", v)).join(" · ")]
        : [],
    },
  ].filter((c) => c.lines.length || preview);

  return (
    <article
      className={cn("@container relative w-full overflow-hidden rounded-card bg-warm-50 shadow-card ring-1 ring-warm-200", className)}
    >
      <Region name="banner" highlight={highlight} className="rounded-none">
        <ProfileBanner style={p.bannerStyle} className="h-24" />
      </Region>

      <div className="relative -mt-14 flex items-end justify-between px-6">
        <Region name="photo" highlight={highlight} className="rounded-4xl">
        <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-4xl border-4 border-white bg-warm-100 shadow-card">
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

      <div className="relative flex flex-col gap-8 px-6 pt-4 pb-6 @3xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Region name="identity" highlight={highlight} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className={cn("type-title", name ? "text-text-primary" : "text-text-placeholder")}>{name}</h2>
              {p.verified ? (
                <VerifiedBadge />
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

          <Section title="Credentials & qualifications" region="credentials" highlight={highlight}>
            <dl className="flex flex-col gap-4">
              {credentials.map((c) => (
                <div key={c.label} className="flex items-start justify-between gap-6">
                  <dt className="type-overline shrink-0 text-text-tertiary">{c.label}</dt>
                  <dd className="flex max-w-[341px] flex-col gap-1 text-right">
                    {c.lines.length ? (
                      c.lines.filter(Boolean).map((line, i) => (
                        <p
                          key={`${line}-${i}`}
                          className={i === 0 ? "type-small font-medium text-text-primary" : "type-caption text-text-tertiary"}
                        >
                          {line}
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

        <aside className="flex h-fit w-full shrink-0 flex-col gap-6 rounded-field border border-warm-200 bg-warm-100 p-6 @3xl:w-[300px]">
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
                <MonitorIcon aria-hidden className="size-4" />
                {formatText} available
              </p>
            )}
            {actions ?? (
              <>
                <span aria-hidden className="flex h-10 items-center justify-center rounded-field bg-brand-primary type-small font-medium text-white shadow-control">
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
          <p className="flex items-center gap-2 type-small text-text-secondary">
            <ShieldIcon aria-hidden className="size-4" />
            Credentials manually verified
          </p>
        </aside>
      </div>
    </article>
  );
}
