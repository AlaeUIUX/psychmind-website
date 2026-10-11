import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PrivacySettings } from "@/components/app/privacy-settings";
import { LoginSettings } from "@/components/app/login-settings";
import { NotificationSettings } from "@/components/app/notification-settings";
import { ALWAYS_SENT } from "@/lib/notifications";
import { notificationSettings } from "@/server/notifications";
import { hasPasswordLogin } from "@/server/account/data";
import { signOut } from "@/server/auth/actions";
import { hasTwoFactor, requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Settings — PsychMind" };

// Patient settings: email, password and log out; two-step login; download or delete your data.
// TODO(client): copy.
export default async function AccountSettingsPage() {
  const { user } = await requireRole("patient", "/account/settings");
  const [hasPassword, notifications] = await Promise.all([hasPasswordLogin(user.id), notificationSettings({ id: user.id, email: user.email, role: "patient" })]);
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Overview", href: "/account" }, { label: "Settings" }]} title="Settings" description="Your account details." />
      <div className="flex flex-col gap-6">
        <LoginSettings email={user.email} hasPassword={hasPassword} twoFactorEnabled={hasTwoFactor(user)} role="patient" signOutAction={signOut} />
        <NotificationSettings settings={notifications} alwaysSent={ALWAYS_SENT.patient} />
        <PrivacySettings hasPassword={hasPassword} twoFactorEnabled={hasTwoFactor(user)} isProvider={false} />
      </div>
    </>
  );
}
