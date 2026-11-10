import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isAdminHostPath } from "@/lib/hosts";
import { safeNext } from "@/lib/safe-next";
import { ensureAdminAccounts } from "@/server/admin/accounts";
import { getSession, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Admin log-in — PsychMind", robots: { index: false } };

// The team's own front door (psychmind.org/admin sends signed-out visitors
// here). Opening it also creates the accounts of newly listed admins, who
// get their temporary password by email.
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const session = await getSession();
  if (session?.user.emailVerified) redirect(session.user.role === "admin" ? "/admin" : homeFor(session.user.role));
  await ensureAdminAccounts();
  // Only pages the admin host serves (the console, and an admin's own
  // change-email and two-step steps); anything else goes to the console.
  const next = safeNext(params.next);
  const allowed = next && isAdminHostPath(next.split(/[?#]/)[0]) && !next.startsWith("/admin/login");
  return <LoginForm admin next={allowed ? next : "/admin"} googleEnabled={false} />;
}
