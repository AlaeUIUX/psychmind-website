import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PrivacySettings } from "@/components/app/privacy-settings";
import { LoginSettings } from "@/components/app/login-settings";
import { hasPasswordLogin } from "@/server/account/data";
import { signOut } from "@/server/auth/actions";
import { hasTwoFactor, requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Settings — PsychMind" };

// Patient settings: email, password and log out; two-step login; download or delete your data.
// TODO(client): copy.
export default async function AccountSettingsPage() {
  const { user } = await requireRole("patient", "/account/settings");
  const hasPassword = await hasPasswordLogin(user.id);
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Overview", href: "/account" }, { label: "Settings" }]} title="Settings" description="Your account details." />
      <div className="flex flex-col gap-6">
        <LoginSettings email={user.email} hasPassword={hasPassword} twoFactorEnabled={hasTwoFactor(user)} role="patient" signOutAction={signOut} />
        <PrivacySettings hasPassword={hasPassword} twoFactorEnabled={hasTwoFactor(user)} isProvider={false} />
      </div>
    </>
  );
}
