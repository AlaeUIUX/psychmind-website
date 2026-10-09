import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequestWizard } from "@/components/requests/request-wizard";
import { parseProfileRef } from "@/lib/provider/links";
import { getSession } from "@/server/auth/session";
import { requestTarget } from "@/server/requests/data";

// "Request a session" for one provider (/request/{name}-{publicId}).

export const metadata: Metadata = { title: "Request a session — PsychMind", robots: { index: false, follow: false } };

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ resume?: string }>;
}) {
  const session = await getSession();
  const [{ ref }, { resume }] = await Promise.all([params, searchParams]);
  const id = parseProfileRef(ref);
  const target = id ? await requestTarget(id) : null;
  if (!target) notFound();
  const user = session?.user;
  const patient = user?.role === "patient" && user.emailVerified ? { name: user.name, email: user.email } : null;
  return <RequestWizard target={target} patient={patient} resume={resume === "1"} />;
}
