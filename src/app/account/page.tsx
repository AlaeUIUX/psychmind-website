import { HeartIcon, InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { SavedProviderCard } from "@/components/directory/saved-provider-card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/server/auth/session";
import { savedProviders } from "@/server/directory/data";

export const metadata: Metadata = { title: "Your account — PsychMind" };

// Patient home: saved providers (Figma V1) and, with the request slice,
// session requests. TODO(client): copy.
export default async function AccountPage() {
  const { user } = await requireRole("patient", "/account");
  const firstName = (user as { firstName?: string | null }).firstName || user.name.split(" ")[0];
  const saved = await savedProviders(user.id);
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Overview" }]} title={`Welcome, ${firstName}`} description="Your saved providers and session requests will appear here." />
      <section aria-labelledby="saved-title" className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 id="saved-title" className="type-title text-text-primary">
            Saved providers
            {saved.length > 0 && <span className="ml-2 type-ui-body text-text-tertiary">{saved.length}</span>}
          </h2>
          {saved.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/providers">Find a provider</Link>
            </Button>
          )}
        </div>
        {saved.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {saved.map((p) => (
              <SavedProviderCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <EmptyState art={<HeartIcon className="size-7" />} title="No saved providers yet" action={<Button asChild><Link href="/providers">Find a provider</Link></Button>}>
            Tap the heart on a profile to keep it here.
          </EmptyState>
        )}
      </section>
      <section aria-labelledby="requests-title" className="flex flex-col gap-4">
        <h2 id="requests-title" className="type-title text-text-primary">
          My requests
        </h2>
        <EmptyState art={<InboxIcon className="size-7" />} title="No requests yet">
          When you request a session, you&apos;ll see its status here.
        </EmptyState>
      </section>
      <CrisisStrip />
    </>
  );
}
