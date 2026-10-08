import type { Metadata } from "next";
import { ProviderTable } from "@/components/admin/provider-table";
import { PageHeader } from "@/components/app/page-header";
import { listProviders } from "@/server/admin/data";

export const metadata: Metadata = { title: "Verification queue — PsychMind admin" };

export default async function AdminQueuePage() {
  const rows = await listProviders("queue");
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Admin" }, { label: "Verification queue" }]}
        title="Verification queue"
        description="Providers waiting for a decision, oldest first. Check each license with the state board before approving."
      />
      <ProviderTable rows={rows} empty={{ title: "Nothing to review", body: "New submissions will appear here." }} />
    </>
  );
}
