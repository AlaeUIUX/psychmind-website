import type { Metadata } from "next";
import { AdminList } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/app/page-header";
import { listAdmins } from "@/server/admin/data";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Admins — PsychMind admin" };

// TODO(client): copy (the admin console isn't designed in Figma).
export default async function AdminsPage() {
  const { user } = await requireRole("admin", "/admin/admins");
  const rows = await listAdmins();
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Admin" }, { label: "Admins" }]}
        title="Admins"
        description="Everyone who can open this console. To add or remove someone, change ADMIN_EMAILS in Vercel and redeploy. New admins get an account and a temporary password by email, and must set their own password and an authenticator app when they first log in."
      />
      <AdminList rows={rows} me={user.id} />
    </>
  );
}
