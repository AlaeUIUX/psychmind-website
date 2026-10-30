import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { safeNext } from "@/lib/safe-next";
import { authFeatures } from "@/server/auth/features";
import { getSession, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Log in — PsychMind", description: "Log in to your PsychMind account." };

// TODO(client): copy.
const notices: Record<string, string> = {
  reset: "Your password was updated. Log in with your new password.",
  verified: "Your email is confirmed. Log in to continue.",
  deleted: "Your account has been deleted.",
};

// An email-confirmation link that didn't work (app/auth/verified). Logging in
// leads to the confirm screen, which sends a new link. TODO(client): copy.
const linkProblems: Record<string, string> = {
  expired: "That confirmation link has expired. Log in to get a new one.",
  invalid: "That confirmation link didn't work. Log in to get a new one.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const session = await getSession();
  if (session?.user.emailVerified) redirect(safeNext(params.next) ?? homeFor(session.user.role));
  const notice = params.reset ? notices.reset : params.verified ? notices.verified : params.deleted ? notices.deleted : undefined;
  // Better Auth sends people back with ?error=… when Google sign-in fails or is cancelled.
  const error = params.error
    ? params.error === "access_denied"
      ? "Google sign-in was cancelled. You can try again or use your email."
      : params.error === "AGE_REQUIRED"
        ? "There's no PsychMind account for that Google address yet. Create one from Sign up."
        : "We couldn't sign you in with Google. Please try again or use your email."
    : undefined;
  return (
    <>
      <LoginForm
        next={params.next}
        googleEnabled={authFeatures.google}
        notice={notice}
        info={params.link ? (linkProblems[params.link] ?? linkProblems.invalid) : undefined}
        error={error}
      />
    </>
  );
}
