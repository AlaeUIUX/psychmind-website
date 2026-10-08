import Link from "next/link";
import { StatusBanner } from "@/components/app/status-banner";
import { Button } from "@/components/ui/button";
import type { ListingState } from "@/lib/billing";
import type { ProviderStatus } from "@/lib/provider/types";

// The account-status banner on every provider dashboard page — one state at
// a time, most urgent first (build plan: provider state machine).
// TODO(client): all copy.
export function ProviderBanner({
  status,
  listing,
  graceDays,
  reviewNote,
  onboardingStep,
  needsReview,
}: {
  status: ProviderStatus;
  listing: ListingState;
  graceDays: number;
  reviewNote: string | null;
  onboardingStep: string;
  needsReview: boolean;
}) {
  const action = (href: string, label: string) => (
    <Button asChild size="sm" variant="primary">
      <Link href={href}>{label}</Link>
    </Button>
  );

  switch (status) {
    case "draft":
      return (
        <StatusBanner tone="info" title="Finish setting up your profile" action={action(`/provider/onboarding/${onboardingStep}`, "Continue setup")}>
          Your profile isn&apos;t visible to anyone yet. Pick up where you left off.
        </StatusBanner>
      );
    case "submitted":
      return (
        <StatusBanner tone="info" title="Your profile is being reviewed">
          We manually verify every provider before their profile goes live. This usually takes 1–2 business days.
        </StatusBanner>
      );
    case "changes_requested":
      return (
        <StatusBanner tone="warning" title="A few changes are needed" action={action(`/provider/onboarding/${onboardingStep}`, "Fix and resubmit")}>
          <span className="whitespace-pre-line">{reviewNote ?? "Our team needs a few updates before your profile can go live."}</span>
        </StatusBanner>
      );
    case "rejected":
      return (
        <StatusBanner tone="danger" title="We couldn't verify your profile" action={action("/contact", "Contact us")}>
          <span className="whitespace-pre-line">{reviewNote ?? "Contact us if you have questions about this decision."}</span>
        </StatusBanner>
      );
    case "suspended":
      return (
        <StatusBanner tone="danger" title="Your profile is suspended" action={action("/contact", "Contact us")}>
          {reviewNote ?? "Your profile is hidden while our team looks into your account."}
        </StatusBanner>
      );
  }

  // Approved: what matters now is billing.
  switch (listing) {
    case "unpaid":
      return (
        <StatusBanner tone="success" title="You're verified" action={action("/provider/billing", "Activate your listing")}>
          Activate your listing to appear in search and start receiving session requests.
        </StatusBanner>
      );
    case "grace":
      return (
        <StatusBanner
          tone="warning"
          countdown={`${graceDays} day${graceDays === 1 ? "" : "s"} left`}
          title="Your payment didn't go through"
          action={action("/provider/billing", "Update payment")}
        >
          Your profile will be paused in {graceDays} day{graceDays === 1 ? "" : "s"} unless your bill is resolved.
        </StatusBanner>
      );
    case "paused":
      return (
        <StatusBanner tone="danger" title="Your profile is hidden from search" action={action("/provider/billing", "Pay now")}>
          Pay your open invoice and you&apos;ll be visible again right away.
        </StatusBanner>
      );
    default:
      return needsReview ? (
        <StatusBanner tone="info" title="We're checking your updated licenses">
          Your profile stays live while our team reviews the changes.
        </StatusBanner>
      ) : null;
  }
}
