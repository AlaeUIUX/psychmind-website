import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PrivacySettings } from "@/components/app/privacy-settings";
import { Button } from "@/components/ui/button";
import { hasPasswordLogin } from "@/server/account/data";
import { signOut } from "@/server/auth/actions";
import { hasTwoFactor, requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Settings — PsychMind" };

// Patient settings: account, two-step login, download or delete your data.
// TODO(client): copy.
export default async function AccountSettingsPage() {
  const { user } = await requireRole("patient", "/account/settings");
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Overview", href: "/account" }, { label: "Settings" }]} title="Settings" description="Your account details." />
      <div className="flex flex-col gap-6">
        <section className="flex max-w-[640px] flex-col gap-5 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
          <dl className="flex flex-col gap-1">
            <dt className="type-overline text-text-tertiary">Email</dt>
            <dd className="type-body text-text-primary">{user.email}</dd>
          </dl>
          <form action={signOut} className="border-t border-warm-200 pt-5">
            <Button type="submit" variant="secondary" size="sm" className="h-9 px-3.5 text-[13px]">
              Log out
            </Button>
          </form>
        </section>
        <PrivacySettings hasPassword={await hasPasswordLogin(user.id)} twoFactorEnabled={hasTwoFactor(user)} isProvider={false} />
      </div>
    </>
  );
}
