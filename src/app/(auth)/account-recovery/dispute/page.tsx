import type { Metadata } from "next";
import { DisputeRecoveryForm, RecoveryLinkInvalid } from "@/components/auth/recovery-link-forms";
import { recoveryForDisputeToken } from "@/server/account/recovery";

export const metadata: Metadata = { title: "Cancel a recovery request — PsychMind", robots: { index: false } };

// "This wasn't me", from the alert sent to the account's own address.
export default async function DisputeRecoveryPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const request = await recoveryForDisputeToken(token);
  if (!token || !request) return <RecoveryLinkInvalid />;
  return <DisputeRecoveryForm token={token} />;
}
