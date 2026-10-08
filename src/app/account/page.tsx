import { HeartIcon, InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Your account — PsychMind" };

// Patient home. Saved providers and session requests arrive with the search
// and request slices; for now both show their empty states. TODO(client): copy.
export default async function AccountPage() {
  const { user } = await requireRole("patient", "/account");
  const firstName = (user as { firstName?: string | null }).firstName || user.name.split(" ")[0];
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Overview" }]} title={`Welcome, ${firstName}`} description="Your saved providers and session requests will appear here." />
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="saved-title" className="flex flex-col gap-4">
          <h2 id="saved-title" className="type-title text-text-primary">
            Saved providers
          </h2>
          <EmptyState art={<HeartIcon className="size-7" />} title="No saved providers yet" action={<Button asChild><Link href="/">Find a provider</Link></Button>}>
            Tap the heart on a profile to keep it here.
          </EmptyState>
        </section>
        <section aria-labelledby="requests-title" className="flex flex-col gap-4">
          <h2 id="requests-title" className="type-title text-text-primary">
            My requests
          </h2>
          <EmptyState art={<InboxIcon className="size-7" />} title="No requests yet">
            When you request a session, you&apos;ll see its status here.
          </EmptyState>
        </section>
      </div>
      <CrisisStrip />
    </>
  );
}
