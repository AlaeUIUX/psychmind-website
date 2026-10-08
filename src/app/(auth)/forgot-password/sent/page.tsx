import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetLinkSent } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Link sent — PsychMind" };

export default async function ResetLinkSentPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <AuthShell>
      <ResetLinkSent email={email ?? ""} />
    </AuthShell>
  );
}
