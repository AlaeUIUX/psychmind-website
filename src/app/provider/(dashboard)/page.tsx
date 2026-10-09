import { eq } from "drizzle-orm";
import { ArrowUpRightIcon, CheckIcon, PencilIcon, UserRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { ProviderAnalyticsView } from "@/components/analytics/provider-analytics";
import { AnalyticsFrame } from "@/components/analytics/range-filter";
import { PageHeader } from "@/components/app/page-header";
import { ProviderProfileView } from "@/components/provider/profile-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { providerProfile } from "@/db/schema";
import { dayOf, parseRange } from "@/lib/analytics/range";
import { isListed, shownListing, stripeConfigured } from "@/lib/billing";
import { profilePath } from "@/lib/provider/links";
import { fileUrl, toProfileView } from "@/lib/provider/state";
import { providerAnalytics } from "@/server/analytics/data";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";
import { providerOverview } from "@/server/provider/status";

export const metadata: Metadata = { title: "Analytics — PsychMind" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Provider home (Figma D1 "Analytics"): their profile at a glance, then how
// it's doing in search. Until they're listed, the same page shows the steps
// to get there and their profile as patients will see it.
export default async function ProviderHome({ searchParams }: Props) {
  const params = await searchParams;
  const { user } = await requireRole("provider", "/provider");
  const state = await loadProviderState(user.id);
  const [row] = await db.select({ pastDueSince: providerProfile.pastDueSince }).from(providerProfile).where(eq(providerProfile.id, state.id));
  const { listing } = await providerOverview(user.id, state, row?.pastDueSince ?? null);
  const approved = state.status === "approved";
  // In the directory now (approval alone lists them until billing is connected).
  const inDirectory = approved && isListed(shownListing(listing));
  const name = (state.displayAsBusiness && state.businessName) || [state.firstName, state.lastName].filter(Boolean).join(" ") || user.name;
  const photo = state.photo ? fileUrl(state.photo.id) : state.externalPhotoUrl;

  const today = dayOf();
  const range = parseRange(params, today);
  // Approved providers have been (or are) in search, so they have numbers.
  const stats = approved ? await providerAnalytics(range) : null;

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
        breadcrumbs={[{ label: "Analytics" }, { label: name }]}
        title="Analytics"
        badge={
          <Badge variant={status.variant} className="gap-1.5">
            <span aria-hidden className={cn("size-1.5 rounded-full", status.dot)} />
            {status.label}
          </Badge>
        }
        description="Track your performance on PsychMind, and use insights to generate more leads."
      />

      <div className="flex flex-col gap-5">
        {/* Figma D1's profile strip. */}
        <section
          aria-label="Your profile"
          className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-4 shadow-control sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-warm-100">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="size-full object-cover" />
              ) : (
                <UserRoundIcon aria-hidden className="size-5 text-warm-400" />
              )}
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate type-ui-heading text-text-primary">{name}</p>
              {state.titleCredentials && <p className="truncate type-ui-small text-text-tertiary">{state.titleCredentials}</p>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {inDirectory && (
              <Button asChild variant="secondary" size="sm">
                <a href={profilePath(state)} target="_blank" rel="noopener">
                  View public profile
                  <ArrowUpRightIcon />
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

        {!inDirectory && <GettingListed steps={steps} />}

        {stats ? (
          <AnalyticsFrame range={range} today={today}>
            <ProviderAnalyticsView stats={stats} range={range} />
          </AnalyticsFrame>
        ) : (
          <section aria-label="Profile preview" className="flex flex-col gap-3">
            <p className="type-small text-text-tertiary">This is how patients will see your profile.</p>
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
    <section aria-labelledby="progress-title" className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-4 shadow-control sm:p-5">
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
