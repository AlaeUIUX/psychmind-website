import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { signOutAdmin } from "@/server/auth/actions";
import { requireRole } from "@/server/auth/session";

// Admin console (nothing is designed in Figma — styled with the app kit).
// Admins log in at /admin/login with a password and an authenticator code;
// requireRole sends anyone who hasn't finished setting up to do so first.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole("admin", "/admin");
  return (
    <AppShell
      homeHref="/admin"
      nav={[
        { href: "/admin", label: "Verification queue" },
        { href: "/admin/providers", label: "All providers" },
        { href: "/admin/analytics", label: "Analytics" },
        { href: "/admin/admins", label: "Admins" },
      ]}
      user={{ name: user.name, email: user.email }}
      onSignOut={signOutAdmin}
    >
      {children}
    </AppShell>
  );
}
