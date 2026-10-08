import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { authFeatures } from "@/server/auth/features";
import { getSession, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Log in — PsychMind", description: "Log in to your PsychMind account." };

const notices: Record<string, string> = {
  reset: "Your password was updated. Log in with your new password.",
  verified: "Your email is confirmed. Log in to continue.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const session = await getSession();
  if (session?.user.emailVerified) redirect(homeFor(session.user.role));
  const notice = params.reset ? notices.reset : params.verified ? notices.verified : undefined;
  return (
    <AuthShell>
      <LoginForm next={params.next} googleEnabled={authFeatures.google} notice={notice} />
    </AuthShell>
  );
}
