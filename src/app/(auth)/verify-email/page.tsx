import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Confirm your email — PsychMind" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <AuthShell showBack={false}>
      <VerifyEmailPanel email={email ?? ""} />
    </AuthShell>
  );
}
