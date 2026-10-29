import { describe, expect, it } from "vitest";
import { accountHealth, needsAttention, type HealthInput } from "@/lib/provider/health";

const sections = [
  { key: "identity", title: "Identity", complete: true },
  { key: "story", title: "Your story", complete: true },
  { key: "credentials", title: "Credentials", complete: true },
] as HealthInput["sections"];

const listed: HealthInput = {
  status: "approved",
  onboardingStep: "review",
  needsReview: false,
  sections,
  licenses: [{ status: "verified" }],
  listing: "live",
  graceDays: 3,
  billingConnected: true,
  newRequests: 0,
};

const row = (rows: ReturnType<typeof accountHealth>, key: string) => rows.find((r) => r.key === key)!;

describe("accountHealth", () => {
  it("is all good for a live, complete, verified provider", () => {
    const rows = accountHealth(listed);
    expect(rows.map((r) => r.key)).toEqual(["listing", "verification", "profile", "licenses", "billing", "requests"]);
    expect(rows.every((r) => r.tone === "good")).toBe(true);
    expect(needsAttention(rows)).toBe(0);
  });

  it("leaves billing out until Stripe is connected", () => {
    expect(row(accountHealth({ ...listed, billingConnected: false }), "billing")).toBeUndefined();
  });

  it("points a draft at the step it stopped on and the first missing section", () => {
    const rows = accountHealth({
      ...listed,
      status: "draft",
      onboardingStep: "story",
      listing: "not_verified",
      licenses: [],
      sections: [sections[0], { ...sections[1], complete: false }, sections[2]],
    });
    expect(row(rows, "verification").action?.href).toBe("/provider/onboarding/story");
    expect(row(rows, "profile")).toMatchObject({ status: "2 of 3 sections complete", action: { href: "/provider/onboarding/story" } });
    expect(row(rows, "licenses").action?.href).toBe("/provider/onboarding/credentials");
    expect(row(rows, "listing").tone).toBe("waiting");
    expect(row(rows, "billing")).toMatchObject({ tone: "waiting" });
  });

  it("sends a listed provider's edits to the profile editor", () => {
    const rows = accountHealth({ ...listed, sections: [{ ...sections[0], complete: false }, sections[1], sections[2]] });
    expect(row(rows, "profile").action?.href).toBe("/provider/profile");
  });

  it("asks for payment in the grace period and counts it", () => {
    const rows = accountHealth({ ...listed, listing: "grace", graceDays: 1 });
    expect(row(rows, "listing")).toMatchObject({ tone: "attention", status: "Payment failed: visible for 1 day more" });
    expect(row(rows, "billing").action?.href).toBe("/provider/billing");
    expect(needsAttention(rows)).toBe(2);
  });

  it("shows new requests and licenses still being checked", () => {
    const rows = accountHealth({ ...listed, newRequests: 3, licenses: [{ status: "verified" }, { status: "pending" }] });
    expect(row(rows, "requests")).toMatchObject({ tone: "new", status: "3 new" });
    expect(row(rows, "licenses")).toMatchObject({ tone: "waiting", status: "1 of 2 verified, the rest being checked" });
  });

  it("says recent edits are in review without losing Verified", () => {
    expect(row(accountHealth({ ...listed, needsReview: true }), "verification")).toMatchObject({ tone: "waiting", status: "Verified · recent changes in review" });
  });
});
