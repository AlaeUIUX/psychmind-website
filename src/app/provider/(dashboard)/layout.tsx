import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { ProviderBanner } from "@/components/provider/provider-banner";
import { db } from "@/db";
import { providerProfile } from "@/db/schema";
import { fileUrl } from "@/lib/provider/state";
import { signOut } from "@/server/auth/actions";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";
import { providerOverview } from "@/server/provider/status";

// Provider dashboard frame (Figma: Analytics · Blogs · Profile · Settings;
// Analytics and Blogs arrive in later slices). A provider who hasn't started
// onboarding is sent to the intro first.
export default async function ProviderDashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole("provider", "/provider");
  const state = await loadProviderState(user.id);
  if (state.status === "draft" && state.onboardingStep === "identity" && !state.firstName) redirect("/provider/onboarding");

  const [row] = await db.select({ pastDueSince: providerProfile.pastDueSince }).from(providerProfile).where(eq(providerProfile.id, state.id));
  const overview = await providerOverview(user.id, state, row?.pastDueSince ?? null);
  const name = [state.firstName, state.lastName].filter(Boolean).join(" ") || user.name;

  return (
    <AppShell
      homeHref="/provider"
      nav={[
        { href: "/provider", label: "Dashboard" },
        { href: "/provider/profile", label: "Profile" },
        { href: "/provider/billing", label: "Billing" },
        { href: "/provider/settings", label: "Settings" },
      ]}
      user={{
        name,
        email: user.email,
        avatarUrl: state.photo ? fileUrl(state.photo.id) : undefined,
        menu: [
          { href: "/provider/profile", label: "Edit profile" },
          { href: "/provider/billing", label: "Billing" },
          { href: "/provider/settings", label: "Settings" },
        ],
      }}
      onSignOut={signOut}
      banner={
        <ProviderBanner
          status={state.status}
          listing={overview.listing}
          graceDays={overview.graceDays}
          reviewNote={state.reviewNote}
          onboardingStep={state.onboardingStep}
          needsReview={state.needsReview}
        />
      }
    >
      {children}
    </AppShell>
  );
}
