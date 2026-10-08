import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Set a new password — PsychMind" };

// Better Auth redirects here with ?token=… (or ?error=INVALID_TOKEN).
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return (
    <AuthShell showBack={false}>
      <ResetPasswordForm token={token} invalid={!!error} />
    </AuthShell>
  );
}
