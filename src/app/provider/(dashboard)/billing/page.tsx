import { and, desc, eq, inArray } from "drizzle-orm";
import { CheckIcon, LockIcon } from "@/components/ui/hugeicons";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { StatusBanner } from "@/components/app/status-banner";
import { ActivateButton, ManageBillingButton, RefreshWhileProcessing } from "@/components/provider/billing-actions";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { auditLog, providerProfile } from "@/db/schema";
import { BASE_PLAN, hasSubscription, renewalTerms, shownListing, stripeConfigured } from "@/lib/billing";
import { locationLimit } from "@/lib/provider/schema";
import { requireRole } from "@/server/auth/session";
import { planPrice } from "@/server/billing/price";
import { loadProviderState } from "@/server/provider/data";
import { providerOverview } from "@/server/provider/status";

export const metadata: Metadata = { title: "Billing — PsychMind" };

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

// Plan, status and the way to pay. Checkout and card management are hosted by
// Stripe. Nothing is designed for this page in Figma (gap) — copy is TODO(client).
export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { user } = await requireRole("provider", "/provider/billing");
  const state = await loadProviderState(user.id);
  const [row] = await db.select({ pastDueSince: providerProfile.pastDueSince }).from(providerProfile).where(eq(providerProfile.id, state.id));
  const { listing, billing, graceDays } = await providerOverview(user.id, state, row?.pastDueSince ?? null);
  // Whether suspending actually paused collection in Stripe (server/billing/pause.ts
  // audits both outcomes): promise "you won't be charged" only then.
  const [lastPause] = await db
    .select({ action: auditLog.action })
    .from(auditLog)
    .where(and(eq(auditLog.targetType, "provider_profile"), eq(auditLog.targetId, state.id), inArray(auditLog.action, ["billing.paused", "billing.pause_failed", "billing.resumed"])))
    .orderBy(desc(auditLog.createdAt))
    .limit(1);
  const billingPaused = lastPause?.action === "billing.paused";
  const { checkout } = await searchParams;
  const connected = stripeConfigured() && Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const verified = state.status === "approved";
  const subscribed = hasSubscription(billing.status);
  // Back from Stripe Checkout before its webhook arrived, or a payment that
  // takes a while to clear (bank debits): don't offer to pay again.
  const confirming = checkout === "success" && !subscribed;
  const processing = confirming || billing.status === "incomplete";
  // Suspended (or rejected) while subscribed: billing is paused in Stripe
  // (server/billing/pause.ts) and they can still cancel.
  const blocked = state.status === "suspended" || state.status === "rejected";
  // Only needed while there's something to buy; checkout re-reads it.
  // Founding providers (server/founding.ts) are listed free, for good: nothing to buy.
  const founding = !!state.founding;
  const terms = verified && !subscribed && !processing && !founding ? await planPrice().then(renewalTerms, () => null) : null;

  // As the dashboard tells it (shownListing): until payments are connected,
  // approval alone lists a provider. TODO(client): "Live", "Processing".
  const shown = shownListing(listing);
  const statusBadge = processing
    ? { variant: "info" as const, label: "Processing" }
    : {
        live: { variant: "success" as const, label: subscribed ? "Active" : "Live" },
        grace: { variant: "warning" as const, label: "Payment failed" },
        paused: { variant: "danger" as const, label: "Paused" },
        unpaid: { variant: "neutral" as const, label: "Not active" },
        not_verified: { variant: "neutral" as const, label: "Not active" },
        blocked: { variant: "danger" as const, label: "Unavailable" },
      }[shown];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Billing" }]}
        title="Billing"
        description="Your plan and payments. Card details are handled securely by Stripe — we never see them."
      />

      {checkout === "success" && !processing && (
        <StatusBanner tone="success" title="Thanks — your payment went through">
          Your listing will be active in a moment. Refresh this page if it doesn&apos;t update.
        </StatusBanner>
      )}
      {/* TODO(client): copy. */}
      {processing && (
        <StatusBanner tone="info" title="We're confirming your payment">
          {confirming
            ? "This usually takes a few seconds. This page updates by itself, so there's no need to pay again."
            : "Your payment is still clearing. Your listing goes live as soon as it does, and we'll email you if anything goes wrong."}
          <RefreshWhileProcessing />
        </StatusBanner>
      )}
      {checkout === "cancelled" && <StatusBanner tone="info" title="Checkout cancelled — you haven't been charged." />}
      {!connected && !founding && (
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
                {/* TODO(client): founding provider copy. */}
                {founding ? "Founding provider" : BASE_PLAN.title}
              </h2>
              <p className="type-small text-text-tertiary">{founding ? BASE_PLAN.summary.replace("Base plan", "Free, for good") : BASE_PLAN.summary}</p>
            </div>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <p className="flex items-baseline gap-1.5">
            <span className="type-ui-hero-figure text-text-primary">{founding ? "Free" : BASE_PLAN.priceLabel}</span>
            <span className="type-body text-text-tertiary">{founding ? "for good" : BASE_PLAN.period}</span>
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {BASE_PLAN.features.filter((f) => !(founding && f === "Cancel anytime")).map((f) => (
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
            {subscribed && blocked ? (
              // TODO(client): copy.
              <div className="flex flex-col gap-1">
                <dt className="type-overline text-text-tertiary">Billing</dt>
                <dd className="type-small text-text-primary">
                  {billingPaused
                    ? "Paused while your profile isn't listed. You won't be charged."
                    : "We're pausing your billing while your profile isn't listed. If you see a charge, contact us."}
                </dd>
              </div>
            ) : (
              billing.periodEnd &&
              subscribed && (
                <div className="flex flex-col gap-1">
                  <dt className="type-overline text-text-tertiary">{billing.cancelAtPeriodEnd ? "Ends on" : "Renews on"}</dt>
                  <dd className="type-small text-text-primary">{dateFmt.format(billing.periodEnd)}</dd>
                </div>
              )
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
            {/* Anyone with a subscription can manage or cancel it, whatever
                their profile's status (the renewal terms promise it). */}
            {subscribed ? (
              <ManageBillingButton label={listing === "grace" || listing === "paused" ? "Update payment" : "Manage billing"} />
            ) : founding ? (
              // TODO(client): copy.
              <p className="type-small text-text-secondary">
                {verified
                  ? "As one of PsychMind's founding providers, your listing is free, for good. There's nothing to pay."
                  : "As one of PsychMind's founding providers, your listing will be free, for good. It goes live once our team verifies your profile."}
              </p>
            ) : confirming ? (
              // TODO(client): copy.
              <p className="type-small text-text-tertiary" aria-live="polite">
                Confirming your payment…
              </p>
            ) : !verified ? (
              <p className="flex items-center gap-2 type-small text-text-tertiary">
                <LockIcon aria-hidden className="size-4" />
                You can activate your listing once your profile is verified.
              </p>
            ) : (
              terms ? (
                // TODO(client): "Reactivate your listing".
                <ActivateButton disabled={!connected} terms={terms} label={billing.status === "canceled" ? "Reactivate your listing" : undefined} />
              ) : (
                <p role="alert" className="type-small text-destructive">
                  We couldn&apos;t load the plan&apos;s price. Refresh the page to try again.
                </p>
              )
            )}
          </div>
        </section>

        <aside className="flex h-fit flex-col gap-3 rounded-card surface-soft p-6">
          <h2 className="type-title text-text-primary">How billing works</h2>
          {founding ? (
            // TODO(client): copy.
            <ul className="flex list-disc flex-col gap-2 pl-5 type-small text-text-secondary">
              <li>Founding providers never pay for their listing.</li>
              <li>Our team still verifies every profile before it appears in search.</li>
              <li>Need more practice locations? Ask our team.</li>
              <li>We never take a commission on your sessions.</li>
            </ul>
          ) : (
            <ul className="flex list-disc flex-col gap-2 pl-5 type-small text-text-secondary">
              <li>You&apos;re only charged after our team verifies your credentials.</li>
              <li>Your plan renews monthly. Cancel anytime from Manage billing.</li>
              <li>If a payment fails, your profile stays visible for 3 days while you update your card.</li>
              <li>We never take a commission on your sessions.</li>
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}
