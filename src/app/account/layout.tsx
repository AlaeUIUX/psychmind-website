import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { signOut } from "@/server/auth/actions";
import { requireRole } from "@/server/auth/session";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole("patient", "/account");
  return (
    <AppShell
      homeHref="/account"
      nav={[
        { href: "/account", label: "Overview" },
        { href: "/providers", label: "Find a provider" },
        { href: "/account/settings", label: "Settings" },
      ]}
      user={{ name: user.name, email: user.email }}
      onSignOut={signOut}
    >
      {children}
    </AppShell>
  );
}
