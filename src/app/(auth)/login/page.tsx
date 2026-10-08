import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { authFeatures } from "@/server/auth/features";
import { getSession, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Log in — PsychMind", description: "Log in to your PsychMind account." };

// TODO(client): copy.
const notices: Record<string, string> = {
  reset: "Your password was updated. Log in with your new password.",
  verified: "Your email is confirmed. Log in to continue.",
  deleted: "Your account has been deleted.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const session = await getSession();
  if (session?.user.emailVerified) redirect(homeFor(session.user.role));
  const notice = params.reset ? notices.reset : params.verified ? notices.verified : params.deleted ? notices.deleted : undefined;
  // Better Auth sends people back with ?error=… when Google sign-in fails or is cancelled.
  const error = params.error
    ? params.error === "access_denied"
      ? "Google sign-in was cancelled. You can try again or use your email."
      : "We couldn't sign you in with Google. Please try again or use your email."
    : undefined;
  return (
    <>
      <LoginForm next={params.next} googleEnabled={authFeatures.google} notice={notice} error={error} />
    </>
  );
}
