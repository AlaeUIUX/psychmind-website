import { describe, expect, it } from "vitest";
import { billingNotices, type CurrentBilling, type PreviousBilling } from "@/lib/billing-notices";

const now = new Date("2026-10-11T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const periodEnd = new Date("2026-11-01T00:00:00Z");

const prev = (p: Partial<PreviousBilling> = {}): PreviousBilling => ({ status: "active", cancelAtPeriodEnd: false, pastDueSince: null, ...p });
const next = (n: Partial<CurrentBilling> = {}): CurrentBilling => ({
  id: "sub_1",
  status: "active",
  cancelAtPeriodEnd: false,
  pastDueSince: null,
  periodEnd,
  ...n,
});
const kinds = (...args: Parameters<typeof billingNotices>) => billingNotices(...args).map((n) => n.kind);

describe("billingNotices", () => {
  it("sends nothing for an ordinary renewal", () => {
    expect(kinds("approved", prev(), next(), now)).toEqual([]);
    expect(kinds("approved", null, next(), now)).toEqual([]);
  });

  it("says the payment failed when a renewal fails", () => {
    const since = hoursAgo(0);
    const notices = billingNotices("approved", prev(), next({ status: "past_due", pastDueSince: since }), now);
    expect(notices).toEqual([{ kind: "payment_failed", key: `payment_failed:${since.toISOString()}` }]);
  });

  it("keeps the same key for the whole past-due episode, so it's sent once", () => {
    const since = hoursAgo(30);
    const first = billingNotices("approved", prev(), next({ status: "past_due", pastDueSince: since }), hoursAgo(29));
    const retry = billingNotices("approved", prev({ status: "past_due", pastDueSince: since }), next({ status: "past_due", pastDueSince: since }), now);
    expect(first.map((n) => n.key)).toEqual(retry.map((n) => n.key));
  });

  it("pauses the profile once the 3-day grace period is over, instead of another failure email", () => {
    const since = hoursAgo(72);
    const pastDue = next({ status: "past_due", pastDueSince: since });
    expect(kinds("approved", prev({ status: "past_due", pastDueSince: since }), pastDue, now)).toEqual(["paused"]);
    expect(kinds("approved", prev({ status: "past_due", pastDueSince: since }), pastDue, hoursAgo(1))).toEqual(["payment_failed"]);
  });

  it("uses one paused key for the cron and a later 'unpaid' webhook", () => {
    const since = hoursAgo(100);
    const fromCron = billingNotices("approved", null, next({ status: "past_due", pastDueSince: since }), now);
    const fromWebhook = billingNotices("approved", prev({ status: "past_due", pastDueSince: since }), next({ status: "unpaid", pastDueSince: since }), now);
    expect(fromCron).toEqual(fromWebhook);
    expect(fromCron[0].kind).toBe("paused");
  });

  it("doesn't call a provider who isn't listed 'paused'", () => {
    const since = hoursAgo(100);
    expect(kinds("suspended", null, next({ status: "past_due", pastDueSince: since }), now)).toEqual(["payment_failed"]);
  });

  it("says the payment went through after a failure, once per episode", () => {
    const since = hoursAgo(50);
    const notices = billingNotices("approved", prev({ status: "past_due", pastDueSince: since }), next(), now);
    expect(notices).toEqual([{ kind: "recovered", key: `recovered:${since.toISOString()}` }]);
    expect(kinds("approved", prev({ status: "unpaid", pastDueSince: since }), next({ status: "trialing" }), now)).toEqual(["recovered"]);
  });

  it("confirms a cancellation at the period's end, with the end date", () => {
    const notices = billingNotices("approved", prev(), next({ cancelAtPeriodEnd: true }), now);
    expect(notices).toEqual([{ kind: "cancel_confirmed", key: `cancel:sub_1:${periodEnd.toISOString()}`, endsAt: periodEnd }]);
    // Repeated webhooks while it winds down carry the same key.
    expect(billingNotices("approved", prev({ cancelAtPeriodEnd: true }), next({ cancelAtPeriodEnd: true }), now)).toEqual(notices);
  });

  it("confirms an immediate cancellation, but not the end of one already confirmed", () => {
    const endedAt = hoursAgo(1);
    expect(billingNotices("approved", prev(), next({ status: "canceled", endedAt }), now)).toEqual([
      { kind: "cancel_confirmed", key: "cancel:sub_1:ended", endsAt: endedAt },
    ]);
    expect(kinds("approved", prev({ cancelAtPeriodEnd: true }), next({ status: "canceled" }), now)).toEqual([]);
    expect(kinds("approved", prev({ status: "canceled" }), next({ status: "canceled" }), now)).toEqual([]);
    // Stripe ending it after failed payments isn't a cancellation they asked for.
    expect(kinds("approved", prev({ status: "unpaid", pastDueSince: hoursAgo(200) }), next({ status: "canceled" }), now)).toEqual([]);
  });
});
