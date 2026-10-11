import { ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { LoginSettings } from "@/components/app/login-settings";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { hasPasswordLogin } from "@/server/account/data";
import { signOutAdmin } from "@/server/auth/actions";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Settings — PsychMind admin" };

// An admin's own login: email (only to another ADMIN_EMAILS address), a
// password of 12+ characters, and two-step login, which admins can't turn off.
// TODO(client): copy.
export default async function AdminSettingsPage() {
  const { user } = await requireRole("admin", "/admin/settings");
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Admin" }, { label: "Settings" }]} title="Settings" description="Your admin login." />
      <div className="flex flex-col gap-6">
        <LoginSettings email={user.email} hasPassword={await hasPasswordLogin(user.id)} twoFactorEnabled role="admin" signOutAction={signOutAdmin} />
        <section className="flex max-w-[640px] flex-col gap-4 rounded-card border border-warm-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8">
          <div className="flex max-w-[440px] flex-col gap-1">
            <h2 className="type-small font-semibold text-text-primary">Two-step login</h2>
            <p className="type-small text-text-tertiary">
              Required for every admin. If you lose your authenticator, another admin can reset your access from Admins.
            </p>
          </div>
          <Badge variant="success" className="self-start sm:self-auto">
            <ShieldCheckIcon />
            On
          </Badge>
        </section>
      </div>
    </>
  );
}
