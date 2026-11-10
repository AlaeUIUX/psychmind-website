import type { Metadata } from "next";
import { ConfirmRecoveryContactForm, RecoveryLinkInvalid } from "@/components/auth/recovery-link-forms";
import { recoveryForContactToken } from "@/server/account/recovery";

export const metadata: Metadata = { title: "Confirm this address — PsychMind", robots: { index: false } };

// The link sent to the new contact address of an account recovery request.
export default async function ConfirmRecoveryContactPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const request = await recoveryForContactToken(token);
  if (!token || !request) return <RecoveryLinkInvalid />;
  return <ConfirmRecoveryContactForm token={token} email={request.contactEmail} />;
}
