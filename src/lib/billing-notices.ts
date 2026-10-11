import { listingState, type SubscriptionStatus } from "@/lib/billing";
import type { ProviderStatus } from "@/lib/provider/types";

// Which billing emails a subscription change calls for (slice 6): payment
// failed, profile paused, payment recovered, cancellation confirmed. Pure, so
// it's unit-tested (tests/unit/billing-notices.test.ts); server/billing/notices.ts
// sends them. Each notice carries a key naming the one event it's about (a
// past-due episode, a billing period): the sender sends a key once, ever, so
// running this again on the same state (a repeated webhook, the daily cron)
// never repeats an email.

export type BillingNoticeKind = "payment_failed" | "paused" | "recovered" | "cancel_confirmed";

export type BillingNotice = {
  kind: BillingNoticeKind;
  /** Unique per event, e.g. "payment_failed:2026-10-01T12:00:00.000Z". */
  key: string;
  /** Cancellation: when the listing stops. */
  endsAt?: Date;
};

/** The subscription as it was before this change (from our records). */
export type PreviousBilling = {
  status: string | null;
  cancelAtPeriodEnd: boolean;
  /** provider_profile.past_due_since before this change. */
  pastDueSince: Date | null;
};

/** The subscription now. */
export type CurrentBilling = {
  id: string;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  /** provider_profile.past_due_since after this change. */
  pastDueSince: Date | null;
  periodEnd: Date | null;
  endedAt?: Date | null;
};

const PAYING = new Set(["active", "trialing"]);
const FAILING = new Set(["past_due", "unpaid"]);
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : "none");

export function billingNotices(
  providerStatus: ProviderStatus,
  prev: PreviousBilling | null,
  next: CurrentBilling,
  now = new Date(),
): BillingNotice[] {
  const notices: BillingNotice[] = [];
  const listing = listingState(
    providerStatus,
    {
      status: (next.status as SubscriptionStatus | null) ?? null,
      pastDueSince: next.pastDueSince,
      periodEnd: next.periodEnd,
      cancelAtPeriodEnd: next.cancelAtPeriodEnd,
    },
    now,
  );
  // One past-due episode, from the first failed renewal until they pay.
  const episode = next.pastDueSince ? iso(next.pastDueSince) : `${next.id}:${iso(next.periodEnd)}`;

  // Paused: the grace period ran out (or Stripe gave up: unpaid / paused).
  // It replaces "payment failed" when both would arrive at once.
  if (listing === "paused") {
    notices.push({ kind: "paused", key: `paused:${episode}` });
  } else if (FAILING.has(next.status ?? "")) {
    notices.push({ kind: "payment_failed", key: `payment_failed:${episode}` });
  }

  // Recovered: paying again after a failed renewal.
  if (PAYING.has(next.status ?? "") && prev?.pastDueSince) {
    notices.push({ kind: "recovered", key: `recovered:${iso(prev.pastDueSince)}` });
  }

  // Cancellation confirmed: set to end at the period's end (the Customer
  // Portal's setting), or ended right away while it was paid up.
  if (PAYING.has(next.status ?? "") && next.cancelAtPeriodEnd && next.periodEnd) {
    notices.push({ kind: "cancel_confirmed", key: `cancel:${next.id}:${iso(next.periodEnd)}`, endsAt: next.periodEnd });
  } else if (next.status === "canceled" && prev && PAYING.has(prev.status ?? "") && !prev.cancelAtPeriodEnd) {
    notices.push({ kind: "cancel_confirmed", key: `cancel:${next.id}:ended`, endsAt: next.endedAt ?? now });
  }

  return notices;
}
