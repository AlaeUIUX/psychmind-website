import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { countOpenRecoveryRequests } from "@/server/account/recovery";
import { signOutAdmin } from "@/server/auth/actions";
import { requireRole } from "@/server/auth/session";

// Admin console (nothing is designed in Figma — styled with the app kit).
// Admins log in at /admin/login with a password and an authenticator code;
// requireRole sends anyone who hasn't finished setting up to do so first.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole("admin", "/admin");
  const openRecovery = await countOpenRecoveryRequests();
  return (
    <AppShell
      homeHref="/admin"
      nav={[
        { href: "/admin", label: "Verification queue" },
        { href: "/admin/providers", label: "All providers" },
        { href: "/admin/analytics", label: "Analytics" },
        {
          href: "/admin/recovery",
          label: "Account recovery",
          badge: openRecovery ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
              {openRecovery}
            </span>
          ) : undefined,
        },
        { href: "/admin/admins", label: "Admins" },
      ]}
      user={{ name: user.name, email: user.email, menu: [{ href: "/admin/settings", label: "Settings" }] }}
      onSignOut={signOutAdmin}
    >
      {children}
    </AppShell>
  );
}
