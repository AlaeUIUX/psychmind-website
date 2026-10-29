import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { changelogFor } from "@/lib/changelog";
import { SIDEBAR_COOKIE } from "@/lib/dashboard";
import { countOpenRecoveryRequests } from "@/server/account/recovery";
import { countQueue } from "@/server/admin/data";
import { signOutAdmin } from "@/server/auth/actions";
import { requireRole } from "@/server/auth/session";

// Admin console (nothing is designed in Figma — styled with the app kit), in
// the dashboard sidebar. Admins log in at /admin/login with a password and an
// authenticator code; requireRole sends anyone who hasn't finished setting up
// to do so first.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole("admin", "/admin");
  const [openRecovery, waiting] = await Promise.all([countOpenRecoveryRequests(), countQueue()]);
  return (
    <DashboardShell
      homeHref="/admin"
      // TODO(client): "Admin console".
      area="Admin console"
      // Analytics is home: visitors, searches and who waits for review, first.
      // TODO(client): the group labels "Review", "Directory" and "Team".
      groups={[
        { items: [{ href: "/admin", label: "Analytics", icon: "analytics" }] },
        {
          label: "Review",
          items: [
            { href: "/admin/queue", label: "Verification queue", icon: "queue", badge: waiting },
            { href: "/admin/recovery", label: "Account recovery", icon: "recovery", badge: openRecovery },
          ],
        },
        { label: "Directory", items: [{ href: "/admin/providers", label: "All providers", icon: "providers" }] },
        {
          label: "Team",
          items: [
            { href: "/admin/admins", label: "Admins", icon: "admins" },
            { href: "/admin/settings", label: "Settings", icon: "settings" },
          ],
        },
      ]}
      whatsNew={{ href: "/admin/whats-new", latestId: changelogFor("admin")[0]?.id, latestTitle: changelogFor("admin")[0]?.title }}
      defaultCollapsed={(await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed"}
      user={{ name: user.name, email: user.email, menu: [{ href: "/admin/settings", label: "Settings" }] }}
      onSignOut={signOutAdmin}
    >
      {children}
    </DashboardShell>
  );
}
