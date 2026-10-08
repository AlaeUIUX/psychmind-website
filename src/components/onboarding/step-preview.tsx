"use client";

import { cn } from "cn";
import { EyeIcon, LockIcon, Maximize2Icon, MapPinIcon, SparklesIcon, StarIcon, UserRoundIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { formatsLabel, ProfileBanner, ProviderProfileView } from "@/components/provider/profile-view";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DoodleHookArrow } from "@/components/ui/doodles";
import type { PreviewRegion, StepKey } from "@/lib/provider/steps";
import type { ProfileView } from "@/lib/provider/types";
import { ageProfileLabel, bannerCta, labelOf, SPECIALTY_CATEGORIES, specialtyCategory, stateName } from "@/lib/taxonomy";

// The onboarding preview, built up step by step like the sign-up panel:
// instead of the whole profile shrunk to fit, each step shows the part of the
// profile it fills in, at real size, in a browser window that wraps it. The
// field being edited is ringed in blue. "Full profile" opens the complete
// page at full size. New copy here is marked TODO(client).

type Block = "whoText" | "clients" | "who" | "about" | "specialties" | "approaches" | "fees" | "education" | "locations" | "licenses";

/** What each step's preview shows (identity and picture show the header). */
const STEP_BLOCKS: Record<Exclude<StepKey, "identity" | "picture">, Block[]> = {
  story: ["whoText", "about"],
  clients: ["clients"],
  expertise: ["specialties", "approaches"],
  practice: ["fees", "education"],
  locations: ["locations"],
  credentials: ["licenses"],
  review: ["who", "about", "specialties", "approaches", "fees", "education", "locations", "licenses"],
};

const slug = (p: ProfileView) =>
  (p.displayAsBusiness && p.businessName ? p.businessName : `${p.firstName ?? ""} ${p.lastName ?? ""}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "your-name";

const fullName = (p: ProfileView) => [p.firstName, p.lastName].filter(Boolean).join(" ");
const displayName = (p: ProfileView) => (p.displayAsBusiness && p.businessName ? p.businessName : fullName(p));

/** A part of the preview the form can point at. */
function Spot({ name, highlight, className, children }: { name: PreviewRegion; highlight: PreviewRegion | null; className?: string; children: ReactNode }) {
  return (
    <div
      data-region={name}
      data-active={highlight === name || undefined}
      className={cn(
        "rounded-lg transition-[box-shadow,background-color] duration-500 ease-out-soft",
        highlight === name && "bg-blue-50/70 shadow-[0_0_0_5px_rgb(239_246_255),0_0_0_6px_rgb(96_165_250)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Avatar({ p, className }: { p: ProfileView; className?: string }) {
  const initials = displayName(p)
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden bg-warm-100 font-semibold text-warm-600", className)}>
      {p.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photoUrl} alt="" className="size-full object-cover" />
      ) : initials ? (
        initials
      ) : (
        <UserRoundIcon aria-hidden className="size-1/2 text-warm-300" />
      )}
    </span>
  );
}

const chip = "inline-flex h-6 items-center gap-1 rounded-md bg-warm-100 px-2 text-[12px] font-medium text-warm-700";

function Chips({ items, empty = 3 }: { items: string[]; empty?: number }) {
  if (!items.length) {
    return (
      <div className="flex flex-wrap gap-1.5" aria-hidden>
        {Array.from({ length: empty }, (_, i) => (
          <span key={i} className="h-6 w-16 rounded-md border border-dashed border-warm-300" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c) => (
        <span key={c} className={chip}>
          {c}
        </span>
      ))}
    </div>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h3 className="text-[13px] font-semibold text-warm-900">{children}</h3>;
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[10.5px] font-medium tracking-wider text-warm-400 uppercase">{children}</p>;
}

function Text({ text, placeholder, lines }: { text?: string; placeholder: string; lines: number }) {
  if (!text?.trim()) return <p className="text-[13px] text-warm-400 italic">{placeholder}</p>;
  return (
    <p className="text-[13px] leading-relaxed whitespace-pre-line text-warm-600" style={{ display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
      {text}
    </p>
  );
}

/** Banner, photo, name and title: what patients see first. */
function Header({ p, highlight, large }: { p: ProfileView; highlight: PreviewRegion | null; large?: boolean }) {
  const name = displayName(p);
  return (
    <div>
      <Spot name="banner" highlight={highlight} className="rounded-none">
        <ProfileBanner style={p.bannerStyle} className="h-20" />
      </Spot>
      <div className="px-5 pb-5">
        <div className="relative -mt-9 flex items-end justify-between">
          <Spot name="photo" highlight={highlight} className="rounded-[20px]">
            <Avatar p={p} className={cn("rounded-2xl border-4 border-white shadow-md transition-[width,height,font-size] duration-500 ease-out-soft", large ? "size-24 text-[26px]" : "size-[72px] text-[20px]")} />
          </Spot>
          <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
            <SparklesIcon className="size-3" />
            {/* TODO(client): copy */}
            Pending verification
          </span>
        </div>
        <Spot name="identity" highlight={highlight} className="-mx-2 mt-3 px-2 py-1">
          <p className={cn("text-[18px] font-semibold tracking-tight", name ? "text-warm-900" : "text-warm-300")}>{name || "Full name"}</p>
          {p.displayAsBusiness && p.businessName && fullName(p) && <p className="text-[12px] text-warm-500">{fullName(p)}</p>}
          <p className="mt-0.5 flex flex-wrap gap-x-1.5 text-[13.5px]">
            <span className={p.titleCredentials ? "text-warm-600" : "text-warm-300"}>{p.titleCredentials || "Title / credentials"}</span>
            {p.pronouns && <span className="text-warm-400">· {p.pronouns}</span>}
          </p>
        </Spot>
      </div>
    </div>
  );
}

/** Small header for the later steps: who this profile belongs to. */
function MiniHeader({ p }: { p: ProfileView }) {
  const name = displayName(p);
  return (
    <div className="flex items-center gap-3 border-b border-warm-200 px-5 py-4">
      <Avatar p={p} className="size-10 rounded-xl text-[13px]" />
      <div className="min-w-0">
        <p className={cn("truncate text-[14px] font-semibold", name ? "text-warm-900" : "text-warm-300")}>{name || "Full name"}</p>
        <p className="truncate text-[12px] text-warm-500">{p.titleCredentials || "Title / credentials"}</p>
      </div>
    </div>
  );
}

function BlockView({ block, p, highlight }: { block: Block; p: ProfileView; highlight: PreviewRegion | null }) {
  const first = p.displayAsBusiness && p.businessName ? p.businessName : p.firstName;
  switch (block) {
    case "whoText":
      return (
        <Spot name="who" highlight={highlight} className="flex flex-col gap-2 p-1">
          <Heading>Who I work with</Heading>
          <Text text={p.whoYouWorkWith} placeholder="Who you work with will appear here." lines={5} />
        </Spot>
      );
    case "about":
      return (
        <Spot name="about" highlight={highlight} className="flex flex-col gap-2 p-1">
          <Heading>{first ? `About ${first}` : "About"}</Heading>
          <Text text={p.about} placeholder="Your story will appear here." lines={7} />
        </Spot>
      );
    case "who":
      // Review: the text and the tags under one heading.
      return (
        <Spot name="who" highlight={highlight} className="flex flex-col gap-2.5 p-1">
          <Heading>Who I work with</Heading>
          <Text text={p.whoYouWorkWith} placeholder="Who you work with will appear here." lines={4} />
          <Chips items={[...(p.sessionParticipants ?? []).map((v) => labelOf("participants", v)), ...(p.ageGroups ?? []).map(ageProfileLabel)]} />
        </Spot>
      );
    case "clients":
      return (
        <Spot name="who" highlight={highlight} className="flex flex-col gap-3 p-1">
          <Heading>Who I work with</Heading>
          <div className="flex flex-col gap-1.5">
            <Label>Session participants</Label>
            <Chips items={(p.sessionParticipants ?? []).map((v) => labelOf("participants", v))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Age groups served</Label>
            <Chips items={(p.ageGroups ?? []).map(ageProfileLabel)} />
          </div>
        </Spot>
      );
    case "specialties": {
      const items = p.specialties ?? [];
      const groups = SPECIALTY_CATEGORIES.map((c) => ({ ...c, items: items.filter((s) => specialtyCategory(s) === c.value) })).filter((g) => g.items.length);
      return (
        <Spot name="specialties" highlight={highlight} className="flex flex-col gap-3 p-1">
          <Heading>Specialties</Heading>
          {groups.length ? (
            groups.map((g) => (
              <div key={g.value} className="flex flex-col gap-1.5">
                <Label>{g.label}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((s) => {
                    const main = s === p.primarySpecialty;
                    return (
                      <span key={s} className={cn(chip, main && "bg-warm-900 text-white")}>
                        {main && <StarIcon aria-hidden className="size-3 fill-current" />}
                        {labelOf("specialties", s)}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <Chips items={[]} />
          )}
        </Spot>
      );
    }
    case "approaches":
      return (
        <Spot name="credentials" highlight={highlight} className="flex flex-col gap-3 p-1">
          <div className="flex flex-col gap-1.5">
            <Label>Approaches</Label>
            <Chips items={(p.approaches ?? []).map((a) => labelOf("approaches", a))} empty={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Languages</Label>
            <Chips items={p.languages ?? []} empty={1} />
          </div>
        </Spot>
      );
    case "fees":
      return (
        <Spot name="fees" highlight={highlight} className="flex flex-col gap-3 p-1">
          <Heading>Session fees</Heading>
          <dl className="grid grid-cols-2 gap-2">
            {[
              ["Individual session", p.feeIndividual],
              ["Couples session", p.feeCouples],
            ].map(([label, fee]) => (
              <div key={label as string} className="rounded-lg bg-warm-50 px-3 py-2.5 ring-1 ring-warm-200 ring-inset">
                <dt>
                  <Label>{label}</Label>
                </dt>
                <dd className={cn("mt-1 font-mono text-[17px] font-medium", fee != null ? "text-warm-900" : "text-warm-300")}>{fee != null ? `$${fee}` : "$—"}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {p.slidingScale && <span className={chip}>Sliding scale available</span>}
            {p.acceptingNewClients === false && <span className={chip}>Not accepting new clients</span>}
          </div>
        </Spot>
      );
    case "education":
      return (
        <Spot name="credentials" highlight={highlight} className="flex flex-col gap-2 p-1">
          <Label>Education</Label>
          {p.education?.length ? (
            p.education.map((e, i) => (
              <div key={i}>
                <p className="text-[13px] font-medium text-warm-800">{e.degree}</p>
                <p className="text-[12px] text-warm-500">{[e.school, e.year].filter(Boolean).join(" · ")}</p>
              </div>
            ))
          ) : (
            <span aria-hidden className="block h-2 w-2/3 rounded bg-warm-100" />
          )}
        </Spot>
      );
    case "locations":
      return (
        <Spot name="location" highlight={highlight} className="flex flex-col gap-2 p-1">
          <Heading>Locations</Heading>
          {(p.locations?.length ? p.locations : [null, null]).map((l, i) =>
            l ? (
              <div key={`${l.state}-${i}`} className="flex items-center gap-3 rounded-lg bg-warm-50 px-3 py-2.5 ring-1 ring-warm-200 ring-inset">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white text-warm-600 ring-1 ring-warm-200">
                  <MapPinIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-warm-900">
                    {l.city || "City"}, {stateName(l.state)}
                  </p>
                  <p className="text-[12px] text-warm-500">{formatsLabel(l.formats) ?? "Session format"}</p>
                </div>
                {/* TODO(client): copy */}
                {l.isPrimary && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">Primary</span>}
              </div>
            ) : (
              <div key={i} aria-hidden className="h-[54px] rounded-lg border border-dashed border-warm-300" />
            ),
          )}
        </Spot>
      );
    case "licenses":
      return (
        <Spot name="credentials" highlight={highlight} className="flex flex-col gap-3 p-1">
          <Heading>Credentials &amp; qualifications</Heading>
          <div className="flex flex-col gap-1.5">
            <Label>License</Label>
            {p.licenses?.length ? (
              p.licenses.map((l) => (
                <p key={l.state} className="flex flex-wrap items-center gap-x-2 text-[13px] text-warm-700">
                  {stateName(l.state)} · License #{l.licenseNumber || "—"}
                  {/* TODO(client): copy (from the sign-up panel) */}
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">Verified after review</span>
                </p>
              ))
            ) : (
              <span aria-hidden className="block h-2 w-3/4 rounded bg-warm-100" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Experience</Label>
            {p.yearsExperience != null ? (
              <p className="text-[13px] text-warm-700">{p.yearsExperience} years in practice</p>
            ) : (
              <span aria-hidden className="block h-2 w-1/3 rounded bg-warm-100" />
            )}
          </div>
        </Spot>
      );
  }
}

/** The step's part of the profile, at real size. */
function Segment({ step, p, highlight }: { step: StepKey; p: ProfileView; highlight: PreviewRegion | null }) {
  if (step === "identity" || step === "picture") {
    return (
      <>
        <Header p={p} highlight={highlight} large={step === "picture"} />
        <div className="flex flex-col gap-1.5 px-5 pb-5" aria-hidden>
          <span className="block h-2 w-full rounded bg-warm-100" />
          <span className="block h-2 w-5/6 rounded bg-warm-100" />
          {/* The banner colour is also the profile's call to action. */}
          <Spot name="banner" highlight={highlight} className="mt-3.5">
            <span className="flex h-9 items-center justify-center rounded-lg text-[13px] font-semibold transition-colors duration-300" style={bannerCta(p.bannerStyle)}>
              Request a session
            </span>
          </Spot>
        </div>
      </>
    );
  }
  const blocks = STEP_BLOCKS[step];
  return (
    <>
      {step === "review" ? <Header p={p} highlight={highlight} /> : <MiniHeader p={p} />}
      <div className={cn("flex flex-col gap-5 px-4 py-4", step === "review" && "border-t border-warm-200")}>
        {blocks.map((b) => (
          <BlockView key={b} block={b} p={p} highlight={highlight} />
        ))}
      </div>
    </>
  );
}

/** Grows and shrinks smoothly with its content. */
function AutoHeight({ children, className }: { children: ReactNode; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize[0]?.blockSize ?? el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className={cn("overflow-hidden transition-[height] duration-500 ease-out-soft motion-reduce:transition-none", className)} style={{ height }}>
      <div ref={inner}>{children}</div>
    </div>
  );
}

function BrowserWindow({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgb(0_0_0/0.05),0_18px_40px_-16px_rgb(0_0_0/0.2)] ring-1 ring-black/[0.06]">
      <div className="flex h-9 items-center gap-3 border-b border-warm-200 bg-warm-50 px-3">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-warm-300" />
          <span className="size-2.5 rounded-full bg-warm-300" />
          <span className="size-2.5 rounded-full bg-warm-300" />
        </span>
        <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-2.5 py-1 font-mono text-[11px] text-warm-500 ring-1 ring-warm-200">
          <LockIcon aria-hidden className="size-3 shrink-0" />
          <span className="truncate">{url}</span>
        </span>
        <span className="w-[42px]" aria-hidden />
      </div>
      {children}
    </div>
  );
}

/** Opens the complete profile, laid out the way patients will see it. */
function FullProfile({ profile }: { profile: ProfileView }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-[12.5px] text-warm-600 hover:text-warm-900">
          <Maximize2Icon className="size-3.5" />
          {/* TODO(client): copy */}
          Full profile
        </Button>
      </DialogTrigger>
      <DialogContent className="app-ui max-h-[90svh] w-[calc(100vw-2rem)] overflow-y-auto p-0 sm:max-w-[1040px]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Your full profile</DialogTitle>
          <DialogDescription>How your profile page will look to patients once it&apos;s live.</DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2">
          <ProviderProfileView profile={profile} mode="preview" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StepPreview({
  profile,
  step,
  highlight,
  className,
}: {
  profile: ProfileView;
  step: StepKey;
  highlight: PreviewRegion | null;
  className?: string;
}) {
  const note = step === "identity" || step === "picture";
  return (
    <div className={cn("paper-gray flex flex-col overflow-hidden rounded-2xl ring-1 ring-black/[0.04] ring-inset", className)} aria-label="Live preview of your profile">
      <div className="flex items-center justify-between px-4 pt-3.5">
        <p className="inline-flex items-center gap-1.5 type-ui-caption font-medium text-warm-600">
          <EyeIcon className="size-3.5" />
          {/* TODO(client): copy */}
          Live preview
        </p>
        <FullProfile profile={profile} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain px-5 pt-14 pb-8 [scrollbar-width:thin]">
        <div className="relative my-auto w-full max-w-[420px]">
          {note && (
            // A handwritten note, as on the sign-up panel ("This is you").
            <div key="note" className="pointer-events-none absolute -top-12 left-1 flex animate-ui-enter items-start gap-1 text-warm-600" aria-hidden>
              <span className="font-display text-[22px] italic">This is you</span>
              <DoodleHookArrow className="mt-4 h-12 w-7" />
            </div>
          )}
          <BrowserWindow url={`psychmind.org/providers/${slug(profile)}`}>
            <AutoHeight>
              <div key={step} className="origin-top animate-focus-in">
                <Segment step={step} p={profile} highlight={highlight} />
              </div>
            </AutoHeight>
          </BrowserWindow>
        </div>
      </div>
    </div>
  );
}
