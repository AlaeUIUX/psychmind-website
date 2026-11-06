import { describe, expect, it } from "vitest";
import { graceDaysLeft, hasSubscription, isListed, listingState, liveAgain, type BillingSnapshot } from "@/lib/billing";

const now = new Date("2026-10-08T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const billing = (b: Partial<BillingSnapshot>): BillingSnapshot => ({
  status: null,
  pastDueSince: null,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  ...b,
});

describe("listingState", () => {
  it("never lists a provider who isn't verified, whatever they paid", () => {
    expect(listingState("draft", billing({ status: "active" }), now)).toBe("not_verified");
    expect(listingState("submitted", billing({ status: "active" }), now)).toBe("not_verified");
    expect(listingState("suspended", billing({ status: "active" }), now)).toBe("blocked");
  });

  it("lists a verified founding provider without a subscription, and never an unverified one", () => {
    expect(listingState("approved", billing({ status: null, founding: true }), now)).toBe("live");
    expect(listingState("approved", billing({ status: "canceled", founding: true }), now)).toBe("live");
    expect(listingState("submitted", billing({ status: null, founding: true }), now)).toBe("not_verified");
    expect(listingState("suspended", billing({ status: null, founding: true }), now)).toBe("blocked");
  });

  it("lists a verified provider with an active subscription", () => {
    expect(listingState("approved", billing({ status: "active" }), now)).toBe("live");
    expect(listingState("approved", billing({ status: "trialing" }), now)).toBe("live");
  });

  it("keeps a past-due provider visible for 3 days, then pauses them", () => {
    expect(listingState("approved", billing({ status: "past_due", pastDueSince: hoursAgo(1) }), now)).toBe("grace");
    expect(listingState("approved", billing({ status: "past_due", pastDueSince: hoursAgo(71) }), now)).toBe("grace");
    expect(listingState("approved", billing({ status: "past_due", pastDueSince: hoursAgo(72) }), now)).toBe("paused");
  });

  it("treats no subscription or a canceled one as unpaid", () => {
    expect(listingState("approved", billing({}), now)).toBe("unpaid");
    expect(listingState("approved", billing({ status: "canceled" }), now)).toBe("unpaid");
  });

  it("only live and grace are visible in search", () => {
    expect(["live", "grace", "paused", "unpaid"].map((s) => isListed(s as never))).toEqual([true, true, false, false]);
  });
});

describe("graceDaysLeft", () => {
  it("counts down whole days", () => {
    expect(graceDaysLeft(hoursAgo(0), now)).toBe(3);
    expect(graceDaysLeft(hoursAgo(25), now)).toBe(2);
    expect(graceDaysLeft(hoursAgo(71), now)).toBe(1);
    expect(graceDaysLeft(hoursAgo(80), now)).toBe(0);
  });
});

describe("hasSubscription", () => {
  it("counts every subscription Stripe still bills or can manage, not ended ones", () => {
    expect(["active", "trialing", "past_due", "unpaid", "paused", "incomplete"].every((s) => hasSubscription(s as never))).toBe(true);
    expect([null, "canceled", "incomplete_expired"].some((s) => hasSubscription(s as never))).toBe(false);
  });
});

describe("liveAgain", () => {
  it("says so for 3 days after a suspension is lifted or a failed payment goes through", () => {
    expect(liveAgain("live", { kind: "back", at: hoursAgo(1) }, now)).toBe(true);
    expect(liveAgain("live", { kind: "back", at: hoursAgo(71) }, now)).toBe(true);
    expect(liveAgain("live", { kind: "back", at: hoursAgo(72) }, now)).toBe(false);
  });

  it("only while they're live, and only when coming back was the latest event", () => {
    expect(liveAgain("paused", { kind: "back", at: hoursAgo(1) }, now)).toBe(false);
    expect(liveAgain("live", { kind: "down", at: hoursAgo(1) }, now)).toBe(false);
    expect(liveAgain("live", null, now)).toBe(false);
  });
});
