import type { Metadata } from "next";
import { LoginSettings } from "@/components/app/login-settings";
import { NotificationSettings } from "@/components/app/notification-settings";
import { ALWAYS_SENT } from "@/lib/notifications";
import { notificationSettings } from "@/server/notifications";
import { PageHeader } from "@/components/app/page-header";
import { PrivacySettings } from "@/components/app/privacy-settings";
import { RequestEmailForm } from "@/components/requests/request-email-form";
import { signOut } from "@/server/auth/actions";
import { hasPasswordLogin } from "@/server/account/data";
import { hasTwoFactor, requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";

export const metadata: Metadata = { title: "Settings — PsychMind" };

// Account settings: email, password and log out, where requests go, which
// emails they get, two-step login, and downloading or deleting your data.
// TODO(client): copy.
export default async function ProviderSettingsPage() {
  const { user } = await requireRole("provider", "/provider/settings");
  const [state, hasPassword, notifications] = await Promise.all([
    loadProviderState(user.id),
    hasPasswordLogin(user.id),
    notificationSettings({ id: user.id, email: user.email, role: "provider" }),
  ]);
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Settings" }]} title="Settings" description="Your account details." />
      <div className="flex flex-col gap-6">
        <LoginSettings email={user.email} hasPassword={hasPassword} twoFactorEnabled={hasTwoFactor(user)} role="provider" signOutAction={signOut} />
        <section className="flex max-w-[640px] flex-col gap-5 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
          <RequestEmailForm current={state.requestEmail} accountEmail={user.email} />
        </section>
        <NotificationSettings settings={notifications} alwaysSent={ALWAYS_SENT.provider} />
        <PrivacySettings hasPassword={hasPassword} twoFactorEnabled={hasTwoFactor(user)} isProvider />
      </div>
    </>
  );
}
