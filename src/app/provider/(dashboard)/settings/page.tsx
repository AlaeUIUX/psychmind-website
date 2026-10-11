import type { Metadata } from "next";
import { LoginSettings } from "@/components/app/login-settings";
import { PageHeader } from "@/components/app/page-header";
import { PrivacySettings } from "@/components/app/privacy-settings";
import { RequestEmailForm } from "@/components/requests/request-email-form";
import { signOut } from "@/server/auth/actions";
import { hasPasswordLogin } from "@/server/account/data";
import { hasTwoFactor, requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";

export const metadata: Metadata = { title: "Settings — PsychMind" };

// Account settings: email, password and log out, where requests go, two-step
// login, and downloading or deleting your data. Notification preferences are
// planned (build plan, provider settings). TODO(client): copy.
export default async function ProviderSettingsPage() {
  const { user } = await requireRole("provider", "/provider/settings");
  const [state, hasPassword] = await Promise.all([loadProviderState(user.id), hasPasswordLogin(user.id)]);
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Settings" }]} title="Settings" description="Your account details." />
      <div className="flex flex-col gap-6">
        <LoginSettings email={user.email} hasPassword={hasPassword} twoFactorEnabled={hasTwoFactor(user)} role="provider" signOutAction={signOut} />
        <section className="flex max-w-[640px] flex-col gap-5 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
          <RequestEmailForm current={state.requestEmail} accountEmail={user.email} />
        </section>
        <PrivacySettings hasPassword={hasPassword} twoFactorEnabled={hasTwoFactor(user)} isProvider />
      </div>
    </>
  );
}
