import { and, count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ProviderBanner } from "@/components/provider/provider-banner";
import { db } from "@/db";
import { providerProfile, sessionRequest } from "@/db/schema";
import { shownListing } from "@/lib/billing";
import { changelogFor } from "@/lib/changelog";
import { SIDEBAR_COOKIE } from "@/lib/dashboard";
import { fileUrl } from "@/lib/provider/state";
import { signOut } from "@/server/auth/actions";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";
import { providerOverview } from "@/server/provider/status";

// Provider dashboard frame: the sidebar (DashboardShell), Overview first
// (Figma's Analytics · Blogs · Profile · Settings; Blogs arrive later). A provider who hasn't started
// onboarding is sent to the intro first.
export default async function ProviderDashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole("provider", "/provider");
  const state = await loadProviderState(user.id);
  if (state.status === "draft" && state.onboardingStep === "identity" && !state.firstName) redirect("/provider/onboarding");

  const [row] = await db.select({ pastDueSince: providerProfile.pastDueSince }).from(providerProfile).where(eq(providerProfile.id, state.id));
  const overview = await providerOverview(user.id, state, row?.pastDueSince ?? null);
  const [{ n: newRequests } = { n: 0 }] = await db
    .select({ n: count() })
    .from(sessionRequest)
    .where(and(eq(sessionRequest.profileId, state.id), eq(sessionRequest.status, "new")));
  const name = [state.firstName, state.lastName].filter(Boolean).join(" ") || user.name;

  return (
    <DashboardShell
      homeHref="/provider"
      // TODO(client): "Provider".
      area="Provider"
      // TODO(client): "Overview", "Your practice" and "Account" (the other labels are Figma's).
      groups={[
        {
          items: [
            { href: "/provider", label: "Overview", icon: "overview" },
            { href: "/provider/requests", label: "Requests", icon: "requests", badge: newRequests },
            { href: "/provider/analytics", label: "Analytics", icon: "analytics" },
          ],
        },
        {
          label: "Your practice",
          items: [
            { href: "/provider/profile", label: "Profile", icon: "profile" },
            { href: "/provider/billing", label: "Billing", icon: "billing" },
          ],
        },
        { label: "Account", items: [{ href: "/provider/settings", label: "Settings", icon: "settings" }] },
      ]}
      whatsNew={{ href: "/provider/whats-new", latestId: changelogFor("provider")[0]?.id, latestTitle: changelogFor("provider")[0]?.title }}
      defaultCollapsed={(await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed"}
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
          listing={shownListing(overview.listing)}
          graceDays={overview.graceDays}
          reviewNote={state.reviewNote}
          onboardingStep={state.onboardingStep}
          needsReview={state.needsReview}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
