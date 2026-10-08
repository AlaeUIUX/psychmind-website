"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/server/auth/actions";
import { GoogleSignIn, LastUsed, rememberMethod, useLastUsed } from "./auth-bits";
import { AuthField, AuthTitle, EmailInput, FormAlert, OrDivider, PasswordInput, SubmitButton } from "./fields";

// Log in. Google first (one tap for most people), then email. Figma A3 copy.
export function LoginForm({ next, googleEnabled, notice }: { next?: string; googleEnabled: boolean; notice?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, null);
  const fe = state?.fieldErrors ?? {};
  const emailLast = useLastUsed() === "email";

  return (
    <div className="flex flex-col gap-7">
      <AuthTitle title="Log in to PsychMind" description="Good to see you again. Pick up right where you left off." />
      <FormAlert message={notice} tone="success" />
      {/* Google sign-in shows once its keys are configured. */}
      {googleEnabled && (
        <>
          <GoogleSignIn enabled />
          <OrDivider />
        </>
      )}
      <form action={action} onSubmit={() => rememberMethod("email")} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <FormAlert message={state?.error} />
        <AuthField id="email" label="Email" error={fe.email}>
          <EmailInput error={fe.email} defaultValue={state?.values?.email} autoFocus />
        </AuthField>
        <AuthField
          id="password"
          label="Password"
          error={fe.password}
          aside={
            <Link href="/forgot-password" className="type-ui-caption text-warm-500 underline-offset-4 hover:text-warm-900 hover:underline">
              Forgot your password?
            </Link>
          }
        >
          <PasswordInput error={fe.password} placeholder="Enter your password" />
        </AuthField>
        <div className="relative pt-1">
          <SubmitButton pendingLabel="Logging in…">Continue</SubmitButton>
          {emailLast && <LastUsed />}
        </div>
        <p className="type-ui-caption text-warm-500">
          By clicking continue, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-warm-900">Terms of Service</Link> and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-warm-900">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}
