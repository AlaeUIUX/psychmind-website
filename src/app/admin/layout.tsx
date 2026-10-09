import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { signOut } from "@/server/auth/actions";
import { requireRole } from "@/server/auth/session";

// Admin console (nothing is designed in Figma — styled with the app kit).
// Two-factor login for admins is planned before launch (build plan slice 5).
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole("admin", "/admin");
  return (
    <AppShell
      homeHref="/admin"
      nav={[
        { href: "/admin", label: "Verification queue" },
        { href: "/admin/providers", label: "All providers" },
        { href: "/admin/analytics", label: "Analytics" },
      ]}
      user={{ name: user.name, email: user.email }}
      onSignOut={signOut}
    >
      {children}
    </AppShell>
  );
}
