import type { Metadata } from "next";
import { ProviderTable } from "@/components/admin/provider-table";
import { SampleProvidersCard } from "@/components/admin/sample-providers-card";
import { PageHeader } from "@/components/app/page-header";
import { listProviders } from "@/server/admin/data";
import { sampleCount } from "@/server/directory/samples";

export const metadata: Metadata = { title: "All providers — PsychMind admin" };

export default async function AdminProvidersPage() {
  const rows = await listProviders("all");
  const samples = await sampleCount();
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "All providers" }]} title="All providers" />
      <div className="mb-6">
        <SampleProvidersCard count={samples} />
      </div>
      <ProviderTable rows={rows} empty={{ title: "No providers yet", body: "Providers appear here as soon as they sign up." }} />
    </>
  );
}
