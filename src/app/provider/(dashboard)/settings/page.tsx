import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { signOut } from "@/server/auth/actions";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Settings — PsychMind" };

// Account settings. Email/password change, notification preferences and
// account deletion are planned (build plan, provider settings) — this first
// version shows the account and sign-out. TODO(client): copy.
export default async function ProviderSettingsPage() {
  const { user } = await requireRole("provider", "/provider/settings");
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Settings" }]} title="Settings" description="Your account details." />
      <section className="flex max-w-[640px] flex-col gap-5 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="type-overline text-text-tertiary">Email</dt>
            <dd className="type-body text-text-primary">{user.email}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="type-overline text-text-tertiary">Password</dt>
            <dd className="type-small text-text-tertiary">
              To change it, log out and use “Forgot your password?” on the log in page.
            </dd>
          </div>
        </dl>
        <form action={signOut} className="border-t border-warm-200 pt-5">
          <Button type="submit" variant="secondary">
            Log out
          </Button>
        </form>
      </section>
    </>
  );
}
