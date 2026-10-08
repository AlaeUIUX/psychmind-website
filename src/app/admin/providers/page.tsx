import type { Metadata } from "next";
import { ProviderTable } from "@/components/admin/provider-table";
import { PageHeader } from "@/components/app/page-header";
import { listProviders } from "@/server/admin/data";

export const metadata: Metadata = { title: "All providers — PsychMind admin" };

export default async function AdminProvidersPage() {
  const rows = await listProviders("all");
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "All providers" }]} title="All providers" />
      <ProviderTable rows={rows} empty={{ title: "No providers yet", body: "Providers appear here as soon as they sign up." }} />
    </>
  );
}
