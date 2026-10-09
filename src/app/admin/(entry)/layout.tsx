import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

// The admin log-in and first-log-in steps, in the same shell as the other
// sign-in pages (the console itself is in (console)).
export default function AdminEntryLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
