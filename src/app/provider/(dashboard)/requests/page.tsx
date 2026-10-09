import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ProviderRequests } from "@/components/requests/provider-requests";
import { providerRequests } from "@/server/requests/data";

export const metadata: Metadata = { title: "Requests — PsychMind" };

// Session requests sent to this provider. TODO(client): copy.
export default async function ProviderRequestsPage() {
  const requests = await providerRequests();
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/provider" }, { label: "Requests" }]}
        title="Session requests"
        description="People who'd like a session with you. Reply by email or phone, then mark them contacted to keep track."
      />
      <ProviderRequests requests={requests} />
    </>
  );
}
