import type { ProviderStatus } from "@/lib/provider/types";

// Provider subscription rules, shared by the dashboard, search and webhooks.
// Pricing copy is from Figma P0 — note the design shows $10 on desktop and
// $39 on mobile (build plan D9); the real price comes from the Stripe price
// on STRIPE_PRICE_BASE, this label only describes it. TODO(client): price.

export const BASE_PLAN = {
  name: "base",
  title: "Base plan",
  priceLabel: "$10",
  period: "/ month",
  summary: "Base plan · 3 licensed states",
  blurb: "Everything you need to get started and start receiving session requests.",
  features: [
    "Cancel anytime",
    "Manual verification — 1 to 2 days",
    "No commission on sessions",
    "Your patient data stays private",
  ],
  /** Figma P5c: "$5 extra per location". */
  extraLocationLabel: "$5 extra per location",
} as const;

/** After a failed renewal the profile stays visible this long (business rule). */
export const GRACE_PERIOD_DAYS = 3;
const DAY = 86_400_000;

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export type BillingSnapshot = {
  status: SubscriptionStatus | null;
  /** When the subscription first went past due (null otherwise). */
  pastDueSince: Date | null;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type ListingState =
  | "not_verified" // still onboarding or in review
  | "blocked" // rejected or suspended
  | "unpaid" // verified, never subscribed (or subscription ended)
  | "live"
  | "grace" // payment failed, still visible for the grace period
  | "paused"; // grace expired: hidden until paid

/** Whether and why a provider appears in search right now. */
export function listingState(status: ProviderStatus, billing: BillingSnapshot, now = new Date()): ListingState {
  if (status === "rejected" || status === "suspended") return "blocked";
  if (status !== "approved") return "not_verified";
  switch (billing.status) {
    case "active":
    case "trialing":
      return "live";
    case "past_due": {
      const since = billing.pastDueSince ?? now;
      return now.getTime() - since.getTime() < GRACE_PERIOD_DAYS * DAY ? "grace" : "paused";
    }
    case "unpaid":
    case "paused":
      return "paused";
    default:
      return "unpaid";
  }
}

export function isListed(state: ListingState) {
  return state === "live" || state === "grace";
}

/** Whole days left in the grace period (at least 1 while it lasts). */
export function graceDaysLeft(pastDueSince: Date | null, now = new Date()) {
  if (!pastDueSince) return GRACE_PERIOD_DAYS;
  const left = GRACE_PERIOD_DAYS - (now.getTime() - pastDueSince.getTime()) / DAY;
  return Math.max(0, Math.ceil(left));
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_BASE);
}
