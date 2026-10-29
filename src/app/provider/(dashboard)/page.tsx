import { and, count, eq } from "drizzle-orm";
import { CheckIcon, CtaArrowIcon, PencilIcon, UserRoundIcon } from "@/components/ui/hugeicons";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { CountTile } from "@/components/analytics/provider-analytics";
import { PageHeader } from "@/components/app/page-header";
import { frame, frameCard } from "@/components/home/search-styles";
import { ProviderProfileView } from "@/components/provider/profile-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { providerProfile, sessionRequest } from "@/db/schema";
import { dayOf, parseRange } from "@/lib/analytics/range";
import { isListed, shownListing, stripeConfigured } from "@/lib/billing";
import { sectionStatuses } from "@/lib/provider/completeness";
import { accountHealth, needsAttention, type HealthTone } from "@/lib/provider/health";
import { profilePath } from "@/lib/provider/links";
import { fileUrl, toProfileView } from "@/lib/provider/state";
import { providerAnalytics } from "@/server/analytics/data";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";
import { providerOverview } from "@/server/provider/status";

export const metadata: Metadata = { title: "Overview — PsychMind" };

const TONE_DOT: Record<HealthTone, string> = {
  good: "bg-emerald-500",
  attention: "bg-amber-500",
  waiting: "bg-warm-900/25",
  new: "bg-blue-600",
};

const sectionTitle = "text-[15px] leading-5 font-medium tracking-[-0.01em] text-warm-900";

/** "Good morning" by the New York clock (analytics days are New York days too). TODO(client). */
function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/New_York" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

// Provider home: a greeting, account health (what decides whether patients
// can find and reach them, with one action per row), then the last days at a
// glance and their profile. Until they're approved, the road to being listed
// and their profile as patients will see it take the numbers' place.
// TODO(client): the greeting, "Account health", its status lines and "Last 7 days".
export default async function ProviderHome() {
  const { user } = await requireRole("provider", "/provider");
  const state = await loadProviderState(user.id);
  const [row] = await db.select({ pastDueSince: providerProfile.pastDueSince }).from(providerProfile).where(eq(providerProfile.id, state.id));
  const { listing, graceDays } = await providerOverview(user.id, state, row?.pastDueSince ?? null);
  const [{ n: newRequests } = { n: 0 }] = await db
    .select({ n: count() })
    .from(sessionRequest)
    .where(and(eq(sessionRequest.profileId, state.id), eq(sessionRequest.status, "new")));
  const approved = state.status === "approved";
  // In the directory now (approval alone lists them until billing is connected).
  const inDirectory = approved && isListed(shownListing(listing));
  const name = (state.displayAsBusiness && state.businessName) || [state.firstName, state.lastName].filter(Boolean).join(" ") || user.name;
  const photo = state.photo ? fileUrl(state.photo.id) : state.externalPhotoUrl;

  const health = accountHealth({
    status: state.status,
    onboardingStep: state.onboardingStep,
    needsReview: state.needsReview,
    sections: sectionStatuses(state),
    licenses: state.licenses,
    listing: shownListing(listing),
    graceDays,
    billingConnected: stripeConfigured(),
    newRequests,
  });
  const attention = needsAttention(health);

  // The default range (the last 7 days), as Analytics opens.
  const week = parseRange({}, dayOf());
  const stats = approved ? await providerAnalytics(week) : null;

  // TODO(client): checklist copy.
  const steps = [
    { label: "Build your profile", done: state.status !== "draft", href: `/provider/onboarding/${state.onboardingStep}` },
    { label: "Get verified by our team", done: approved, href: null },
    // Nothing to activate until billing is connected.
    ...(stripeConfigured()
      ? [{ label: "Activate your listing", done: listing === "live" || listing === "grace" || listing === "paused", href: "/provider/billing" }]
      : []),
    { label: "Appear in search", done: inDirectory, href: null },
  ];
  const status = inDirectory
    ? { variant: "success" as const, dot: "bg-emerald-500", label: "Live" }
    : state.status === "submitted"
      ? { variant: "info" as const, dot: "bg-sky-500", label: "In review" }
      : approved
        ? { variant: "warning" as const, dot: "bg-amber-500", label: "Not listed" }
        : { variant: "neutral" as const, dot: "bg-warm-400", label: "Not visible yet" };

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${state.firstName || name}`}
        badge={
          <Badge variant={status.variant} className="gap-1.5">
            <span aria-hidden className={cn("size-1.5 rounded-full", status.dot)} />
            {status.label}
          </Badge>
        }
        description={attention ? `${attention} thing${attention === 1 ? " needs" : "s need"} your attention.` : "Everything is in order."}
      />

      <div className="flex flex-col gap-5">
        {/* The landing's privacy promise layers: the grey frame holds the
            title, the white card one row per check. */}
        <section aria-labelledby="health-title" className={frame}>
          <div className="flex items-center justify-between gap-3 px-3 pt-1.5 pb-2.5">
            <h2 id="health-title" className={sectionTitle}>
              Account health
            </h2>
            <span className="text-[13px] text-warm-900/60">{attention ? `${attention} to look at` : "All good"}</span>
          </div>
          <ul className={cn(frameCard, "divide-y divide-warm-900/[0.06]")}>
            {health.map((r) => (
              // Phones: the label over the status, the action beside both; wider, one line.
              <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:flex sm:min-h-14">
                <span className="flex items-center gap-2.5 text-[13px] text-warm-900/60 sm:w-32 sm:shrink-0">
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", TONE_DOT[r.tone])} />
                  {r.label}
                </span>
                <span className="row-start-2 min-w-0 pl-[18px] text-sm text-warm-900 sm:flex-1 sm:pl-0">{r.status}</span>
                {r.action && (
                  <Button asChild variant="secondary" size="sm" className="col-start-2 row-span-2 row-start-1 sm:ml-auto">
                    <Link href={r.action.href}>{r.action.label}</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {stats ? (
          <section aria-labelledby="glance-title" className={frame}>
            <div className="flex items-center justify-between gap-3 px-3 pt-1.5 pb-2.5">
              <h2 id="glance-title" className={sectionTitle}>
                Last {week.days} days
              </h2>
              <Link href="/provider/analytics" className="text-[13px] text-warm-900/60 underline underline-offset-4 transition-colors hover:text-warm-900">
                See all analytics
              </Link>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-3">
              <CountTile label="Profile views" current={stats.current.views} previous={stats.previous.views} info="Times patients opened your profile, in a quick look or in full." />
              <CountTile label="Session requests" current={stats.current.requests} previous={stats.previous.requests} info="Requests patients sent you through PsychMind." />
              <CountTile label="Saves" current={stats.current.saves} previous={stats.previous.saves} info="Times patients saved your profile to come back to." />
            </div>
          </section>
        ) : (
          <GettingListed steps={steps} />
        )}

        {/* Figma D1's profile strip. */}
        <section aria-label="Your profile" className={cn(frameCard, "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5")}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-warm-900/[0.05]">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="size-full object-cover" />
              ) : (
                <UserRoundIcon aria-hidden className="size-5 text-warm-900/40" />
              )}
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate type-ui-heading text-warm-900">{name}</p>
              {state.titleCredentials && <p className="truncate type-ui-small text-warm-900/60">{state.titleCredentials}</p>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {inDirectory && (
              <Button asChild variant="secondary" size="sm">
                <a href={profilePath(state)} target="_blank" rel="noopener">
                  View public profile
                  <CtaArrowIcon />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            )}
            <Button asChild variant="secondary" size="sm">
              <Link href="/provider/profile">
                <PencilIcon />
                Edit profile
              </Link>
            </Button>
          </div>
        </section>

        {!stats && (
          <section aria-label="Profile preview" className="flex flex-col gap-3">
            <p className="type-small text-warm-900/60">This is how patients will see your profile.</p>
            <ProviderProfileView profile={toProfileView(state)} mode="preview" />
          </section>
        )}
      </div>
    </>
  );
}

type Step = { label: string; done: boolean; href: string | null };

/** The road to being listed: done steps get a green check, the current one a
 *  pulsing dot (the same timeline as the "submitted" screen). */
function GettingListed({ steps }: { steps: Step[] }) {
  const current = steps.findIndex((s) => !s.done);
  return (
    <section aria-labelledby="progress-title" className={cn(frameCard, "flex flex-col gap-4 p-4 sm:p-5")}>
      <h2 id="progress-title" className="type-ui-heading text-text-primary">
        Getting listed
      </h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:flex lg:gap-0">
        {steps.map((step, i) => {
          const status = step.done ? "done" : i === current ? "current" : "todo";
          return (
            <li key={step.label} className="relative flex gap-3 lg:flex-1 lg:pr-6">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  status === "done" && "bg-emerald-600 text-white",
                  status === "current" && "border-2 border-amber-500 bg-white",
                  status === "todo" && "border-2 border-warm-200 bg-white",
                )}
              >
                {status === "done" && <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />}
                {status === "current" && <span className="size-2 animate-pulse rounded-full bg-amber-500" />}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                <span className={cn("type-ui-label", status === "todo" ? "text-text-tertiary" : "text-text-primary")}>{step.label}</span>
                {status === "current" && step.href && (
                  <Link href={step.href} className="w-fit type-ui-caption font-medium text-blue-700 underline-offset-4 hover:underline">
                    Continue &rarr;
                  </Link>
                )}
              </div>
              <span className="sr-only">{status === "done" ? "Done" : status === "current" ? "In progress" : "Not started"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
