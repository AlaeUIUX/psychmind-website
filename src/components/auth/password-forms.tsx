"use client";

import { ArrowLeftIcon, ArrowUpRightIcon, KeyRoundIcon, MailCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { inboxLink } from "@/lib/auth/email-typos";
import { requestPasswordReset, resendVerification, resetPassword, type AuthState } from "@/server/auth/actions";
import { AuthField, AuthTitle, EmailInput, FormAlert, PasswordInput, SubmitButton } from "./fields";

function BackToLogin() {
  return (
    <Link href="/login" className="inline-flex w-fit items-center gap-1.5 type-ui-small text-warm-500 hover:text-warm-900">
      <ArrowLeftIcon className="size-3.5" />
      Back to log in
    </Link>
  );
}

/** The address an email went to, with expiry — Figma A5's "We sent an email!" card. */
function SentTo({ email, what, expires }: { email: string; what: string; expires: string }) {
  const inbox = inboxLink(email);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-warm-200 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warm-100 text-warm-700">
          <MailCheckIcon className="size-[18px]" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="type-ui-label text-warm-900">We sent an email!</span>
          <span className="truncate type-ui-small text-warm-600" data-testid="sent-to">
            {email || "your inbox"}
          </span>
        </div>
      </div>
      <p className="type-ui-caption text-warm-500">
        {what} · Expires in <span className="font-medium text-brand-primary">{expires}</span>
      </p>
      {inbox && (
        <Button asChild variant="secondary" size="sm" className="h-9 w-fit shadow-none">
          <a href={inbox.href} target="_blank" rel="noopener noreferrer">
            {inbox.label}
            <ArrowUpRightIcon />
          </a>
        </Button>
      )}
    </div>
  );
}

/** "Resend" with a cooldown so people don't hammer it (and hit the rate limit). */
function ResendButton({ seconds = 30, children }: { seconds?: number; children: string }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <button
      type="submit"
      disabled={left > 0}
      onClick={() => setTimeout(() => setLeft(seconds), 0)}
      className="font-medium text-warm-900 underline underline-offset-4 disabled:cursor-not-allowed disabled:text-warm-400 disabled:no-underline"
    >
      {left > 0 ? `${children} in ${left}s` : children}
    </button>
  );
}

// Figma A4 "Reset your password".
export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, null);
  const fe = state?.fieldErrors ?? {};
  return (
    <div className="flex flex-col gap-7">
      <BackToLogin />
      <AuthTitle title="Reset your password" description="Enter the email address linked to your account and we will send you a reset link." />
      <form action={action} noValidate className="flex flex-col gap-4">
        <FormAlert message={state?.error} />
        <AuthField id="email" label="Email" error={fe.email} hint="We will only send a link if this email is registered.">
          <EmailInput error={fe.email} defaultValue={state?.values?.email} autoFocus />
        </AuthField>
        <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
      </form>
    </div>
  );
}

// Figma A5 "Link sent".
export function ResetLinkSent({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-7">
      <BackToLogin />
      <AuthTitle eyebrow="Almost done" title="Link sent" description="Open the link in the email to choose a new password." />
      <SentTo email={email} what="Reset link" expires="30 min" />
      <p className="type-ui-small text-warm-600">
        Didn&apos;t receive it? Check your spam folder or{" "}
        <Link href="/forgot-password" className="font-medium text-warm-900 underline underline-offset-4">
          try again
        </Link>
        .
      </p>
    </div>
  );
}

// Figma A6 "Set a new password". An expired or used link gets its own state.
export function ResetPasswordForm({ token, invalid }: { token?: string; invalid?: boolean }) {
  const [state, action] = useActionState<AuthState, FormData>(resetPassword, null);
  const fe = state?.fieldErrors ?? {};

  if (invalid || !token) {
    return (
      <div className="flex flex-col gap-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-warm-100 text-warm-700">
          <KeyRoundIcon className="size-5" />
        </span>
        <AuthTitle title="This link has expired" description="Reset links work once and expire after 30 minutes. Request a new one to continue." />
        <Button asChild fullWidth className="h-10 text-[14px]">
          <Link href="/forgot-password">Send a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <AuthTitle eyebrow="Almost done" title="Set a new password" description="Choose something secure you haven't used before." />
      <form action={action} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <FormAlert message={state?.error ?? fe.token} />
        <AuthField id="password" label="New password" error={fe.password} hint="Must be at least 8 characters long.">
          <PasswordInput error={fe.password} meter autoComplete="new-password" />
        </AuthField>
        <SubmitButton pendingLabel="Saving…">Reset password</SubmitButton>
      </form>
    </div>
  );
}

// Not in Figma: email verification after sign-up, with resend + webmail shortcut.
// TODO(client): copy.
export function VerifyEmailPanel({ email }: { email: string }) {
  const [state, action] = useActionState<AuthState, FormData>(resendVerification, null);
  const resent = state?.values?.sent === "1";
  const router = useRouter();

  // Confirming in another tab signs this browser in — notice and move on.
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const { data } = await authClient.getSession().catch(() => ({ data: null }));
      if (data?.user?.emailVerified) router.replace("/auth/continue");
    };
    const t = setInterval(check, 4000);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", check);
    };
  }, [router]);
  return (
    <div className="flex flex-col gap-7">
      <AuthTitle eyebrow="Almost done" title="Confirm your email" description="Open the link we sent to finish creating your account." />
      <SentTo email={email} what="Confirmation link" expires="24 hours" />
      <FormAlert message={state?.error} />
      <FormAlert message={resent ? "We sent a new link. It can take a minute to arrive." : undefined} tone="success" />
      <form action={action} className="type-ui-small text-warm-600">
        <input type="hidden" name="email" value={email} />
        Didn&apos;t receive it? Check your spam folder or <ResendButton>send it again</ResendButton>.
      </form>
      <p className="type-ui-small text-warm-600">
        Wrong email?{" "}
        <Link href="/signup" className="font-medium text-warm-900 underline underline-offset-4">
          Start again
        </Link>
      </p>
    </div>
  );
}
