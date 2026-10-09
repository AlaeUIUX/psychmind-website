import { eq } from "drizzle-orm";
import { CheckIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { StatusBanner } from "@/components/app/status-banner";
import { ActivateButton, ManageBillingButton } from "@/components/provider/billing-actions";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { providerProfile } from "@/db/schema";
import { BASE_PLAN, stripeConfigured } from "@/lib/billing";
import { locationLimit } from "@/lib/provider/schema";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";
import { providerOverview } from "@/server/provider/status";

export const metadata: Metadata = { title: "Billing — PsychMind" };

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

// Plan, status and the way to pay. Checkout and card management are hosted by
// Stripe. Nothing is designed for this page in Figma (gap) — copy is TODO(client).
export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { user } = await requireRole("provider", "/provider/billing");
  const state = await loadProviderState(user.id);
  const [row] = await db.select({ pastDueSince: providerProfile.pastDueSince }).from(providerProfile).where(eq(providerProfile.id, state.id));
  const { listing, billing, graceDays } = await providerOverview(user.id, state, row?.pastDueSince ?? null);
  const { checkout } = await searchParams;
  const connected = stripeConfigured() && Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const verified = state.status === "approved";
  const hasSubscription = billing.status !== null && billing.status !== "canceled" && billing.status !== "incomplete_expired";

  const statusBadge = {
    live: { variant: "success" as const, label: "Active" },
    grace: { variant: "warning" as const, label: "Payment failed" },
    paused: { variant: "danger" as const, label: "Paused" },
    unpaid: { variant: "neutral" as const, label: "Not active" },
    not_verified: { variant: "neutral" as const, label: "Not active" },
    blocked: { variant: "danger" as const, label: "Unavailable" },
  }[listing];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Billing" }]}
        title="Billing"
        description="Your plan and payments. Card details are handled securely by Stripe — we never see them."
      />

      {checkout === "success" && (
        <StatusBanner tone="success" title="Thanks — your payment went through">
          Your listing will be active in a moment. Refresh this page if it doesn&apos;t update.
        </StatusBanner>
      )}
      {checkout === "cancelled" && <StatusBanner tone="info" title="Checkout cancelled — you haven't been charged." />}
      {!connected && (
        <StatusBanner tone="info" title="Payments aren't connected yet">
          Once Stripe is connected you&apos;ll be able to activate your listing here.
          {process.env.NODE_ENV !== "production" && " Dev: set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and STRIPE_PRICE_BASE."}
        </StatusBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="plan-title" className="flex flex-col gap-6 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="plan-title" className="type-ui-title text-text-primary">
                {BASE_PLAN.title}
              </h2>
              <p className="type-small text-text-tertiary">{BASE_PLAN.summary}</p>
            </div>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <p className="flex items-baseline gap-1.5">
            <span className="type-ui-hero-figure text-text-primary">{BASE_PLAN.priceLabel}</span>
            <span className="type-body text-text-tertiary">{BASE_PLAN.period}</span>
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {BASE_PLAN.features.map((f) => (
              <li key={f} className="flex items-center gap-2 type-small text-text-secondary">
                <CheckIcon aria-hidden className="size-4 text-emerald-600" />
                {f}
              </li>
            ))}
          </ul>

          <dl className="grid gap-4 border-t border-warm-200 pt-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="type-overline text-text-tertiary">Practice locations</dt>
              <dd className="type-small text-text-primary">
                {state.locations.length} of {locationLimit(state.extraLocations)} used
              </dd>
            </div>
            {billing.periodEnd && hasSubscription && (
              <div className="flex flex-col gap-1">
                <dt className="type-overline text-text-tertiary">{billing.cancelAtPeriodEnd ? "Ends on" : "Renews on"}</dt>
                <dd className="type-small text-text-primary">{dateFmt.format(billing.periodEnd)}</dd>
              </div>
            )}
            {listing === "grace" && (
              <div className="flex flex-col gap-1">
                <dt className="type-overline text-text-tertiary">Grace period</dt>
                <dd className="type-small text-text-primary">
                  {graceDays} day{graceDays === 1 ? "" : "s"} left before your profile is paused
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap gap-3 border-t border-warm-200 pt-6">
            {!verified ? (
              <p className="flex items-center gap-2 type-small text-text-tertiary">
                <LockIcon aria-hidden className="size-4" />
                You can activate your listing once your profile is verified.
              </p>
            ) : hasSubscription ? (
              <ManageBillingButton label={listing === "grace" || listing === "paused" ? "Update payment" : "Manage billing"} />
            ) : (
              <ActivateButton disabled={!connected} />
            )}
          </div>
        </section>

        <aside className="flex h-fit flex-col gap-3 rounded-card surface-soft p-6">
          <h2 className="type-title text-text-primary">How billing works</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 type-small text-text-secondary">
            <li>You&apos;re only charged after our team verifies your credentials.</li>
            <li>Your plan renews monthly. Cancel anytime from Manage billing.</li>
            <li>If a payment fails, your profile stays visible for 3 days while you update your card.</li>
            <li>We never take a commission on your sessions.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
