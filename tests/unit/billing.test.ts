import { describe, expect, it } from "vitest";
import { graceDaysLeft, isListed, listingState, type BillingSnapshot } from "@/lib/billing";

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
