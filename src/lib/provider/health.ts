import type { ListingState } from "@/lib/billing";
import type { SectionStatus } from "@/lib/provider/completeness";
import type { ProviderStatus } from "@/lib/provider/types";

// Account health on the provider's Overview: one row per thing that decides
// whether patients can find and reach them, each with a tone and, when there's
// something to do, one action. Pure, so the rules are unit-tested.
// TODO(client): every label and status line.

export type HealthTone = "good" | "attention" | "waiting" | "new";
export type HealthRow = {
  key: "listing" | "verification" | "profile" | "licenses" | "billing" | "requests";
  label: string;
  status: string;
  tone: HealthTone;
  action?: { href: string; label: string };
};

export type HealthInput = {
  status: ProviderStatus;
  onboardingStep: string;
  needsReview: boolean;
  sections: SectionStatus[];
  licenses: { status: "pending" | "verified" | "rejected" }[];
  /** As the provider is told it (shownListing). */
  listing: ListingState;
  graceDays: number;
  /** Stripe is set up, so billing decides the listing. */
  billingConnected: boolean;
  newRequests: number;
};

const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

export function accountHealth(h: HealthInput): HealthRow[] {
  const draft = h.status === "draft" || h.status === "changes_requested";
  const editHref = (key: string) => (draft ? `/provider/onboarding/${key}` : "/provider/profile");
  const rows: HealthRow[] = [];

  const listing: Record<ListingState, Omit<HealthRow, "key" | "label">> = {
    live: { status: "Live in search", tone: "good" },
    grace: { status: `Payment failed: visible for ${days(h.graceDays)} more`, tone: "attention", action: { href: "/provider/billing", label: "Update payment" } },
    paused: { status: "Hidden until your bill is paid", tone: "attention", action: { href: "/provider/billing", label: "Update payment" } },
    unpaid: { status: "Verified, not listed yet", tone: "attention", action: { href: "/provider/billing", label: "Activate" } },
    not_verified: { status: "Not visible yet", tone: "waiting" },
    blocked: { status: "Not listed", tone: "attention", action: { href: "/contact", label: "Contact us" } },
  };
  rows.push({ key: "listing", label: "Listing", ...listing[h.listing] });

  const verification: Record<ProviderStatus, Omit<HealthRow, "key" | "label">> = {
    draft: { status: "Submit your profile to be verified", tone: "attention", action: { href: `/provider/onboarding/${h.onboardingStep}`, label: "Continue setup" } },
    submitted: { status: "In review (1–2 business days)", tone: "waiting" },
    changes_requested: { status: "A few changes are needed", tone: "attention", action: { href: `/provider/onboarding/${h.onboardingStep}`, label: "Fix and resubmit" } },
    approved: h.needsReview ? { status: "Verified · recent changes in review", tone: "waiting" } : { status: "Verified", tone: "good" },
    rejected: { status: "We couldn't verify your profile", tone: "attention", action: { href: "/contact", label: "Contact us" } },
    suspended: { status: "Suspended", tone: "attention", action: { href: "/contact", label: "Contact us" } },
  };
  rows.push({ key: "verification", label: "Verification", ...verification[h.status] });

  const done = h.sections.filter((s) => s.complete).length;
  const missing = h.sections.find((s) => !s.complete);
  rows.push(
    missing
      ? { key: "profile", label: "Profile", status: `${done} of ${h.sections.length} sections complete`, tone: "attention", action: { href: editHref(missing.key), label: `Add ${missing.title.toLowerCase()}` } }
      : { key: "profile", label: "Profile", status: "Complete", tone: "good" },
  );

  const verified = h.licenses.filter((l) => l.status === "verified").length;
  const licenses: Omit<HealthRow, "key" | "label"> = !h.licenses.length
    ? { status: "No license added", tone: "attention", action: { href: editHref("credentials"), label: "Add a license" } }
    : h.licenses.some((l) => l.status === "rejected")
      ? { status: "A license couldn't be verified", tone: "attention", action: { href: editHref("credentials"), label: "Review" } }
      : verified === h.licenses.length
        ? { status: `${verified} verified`, tone: "good" }
        : { status: `${verified} of ${h.licenses.length} verified, the rest being checked`, tone: "waiting" };
  rows.push({ key: "licenses", label: "Licenses", ...licenses });

  if (h.billingConnected) {
    const billing: Omit<HealthRow, "key" | "label"> =
      h.listing === "live"
        ? { status: "Active", tone: "good" }
        : h.listing === "grace" || h.listing === "paused"
          ? { status: "Payment needed", tone: "attention", action: { href: "/provider/billing", label: "Update payment" } }
          : h.status === "approved"
            ? { status: "Not active", tone: "attention", action: { href: "/provider/billing", label: "Activate" } }
            : { status: "Starts once you're verified", tone: "waiting" };
    rows.push({ key: "billing", label: "Billing", ...billing });
  }

  rows.push(
    h.newRequests
      ? { key: "requests", label: "Requests", status: `${h.newRequests} new`, tone: "new", action: { href: "/provider/requests", label: "Open" } }
      : { key: "requests", label: "Requests", status: "All caught up", tone: "good" },
  );

  return rows;
}

/** How many rows want something from the provider. */
export const needsAttention = (rows: HealthRow[]) => rows.filter((r) => r.tone === "attention").length;
