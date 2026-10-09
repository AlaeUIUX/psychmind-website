import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPasswordForm } from "@/components/admin/admin-password-form";
import { getSession, homeFor, mustChangePassword } from "@/server/auth/session";

export const metadata: Metadata = { title: "Choose your password — PsychMind admin", robots: { index: false } };

// Where requireRole sends an admin who's still on their temporary password.
export default async function AdminPasswordPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.user.role !== "admin") redirect(homeFor(session.user.role));
  if (!mustChangePassword(session.user)) redirect("/admin");
  const user = session.user as typeof session.user & { firstName?: string | null; lastName?: string | null };
  return <AdminPasswordForm email={user.email} firstName={user.firstName ?? ""} lastName={user.lastName ?? ""} />;
}
