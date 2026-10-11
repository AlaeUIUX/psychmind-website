import type { Metadata } from "next";
import { RecoveryForm } from "@/components/auth/recovery-form";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Can't access your email? — PsychMind", description: "Ask our support team to move your PsychMind account to a new email." };

// Linked from "Reset your password", from Settings → Change email, and from
// the "your email was changed" email. Open to everyone; see /api/account-recovery.
export default async function AccountRecoveryPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const [{ email }, session] = await Promise.all([searchParams, getSession()]);
  return <RecoveryForm signedInEmail={session?.user.emailVerified ? session.user.email : undefined} defaultEmail={email?.slice(0, 254)} />;
}
