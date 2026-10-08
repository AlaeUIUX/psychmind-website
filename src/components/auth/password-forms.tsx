"use client";

import { cn } from "cn";
import { EyeIcon, EyeOffIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, resendVerification, resetPassword, type AuthState } from "@/server/auth/actions";
import { AuthHeading } from "./auth-shell";
import { FieldMessage, FormError, SubmitButton } from "./auth-bits";

/** Figma A4–A6 progress: three dashes. */
function Dashes({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div aria-hidden className="flex justify-center gap-1.5">
      {[1, 2, 3].map((n) => (
        <span key={n} className={cn("h-1 w-8 rounded-pill", n === active ? "bg-warm-900" : "bg-warm-200")} />
      ))}
    </div>
  );
}

// Figma A4 "Reset your password".
export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, null);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} noValidate>
      <FieldGroup>
        <Dashes active={1} />
        <AuthHeading
          eyebrow="Forgot password"
          title="Reset your password"
          description="Enter the email address linked to your account and we will send you a reset link."
        />
        <FormError message={state?.error} />
        <Field data-invalid={fe.email ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="m@example.com"
            defaultValue={state?.values?.email}
            aria-invalid={!!fe.email}
            aria-describedby={fe.email ? "email-error" : "email-hint"}
            required
          />
          {fe.email ? (
            <FieldMessage id="email-error" message={fe.email} />
          ) : (
            <FieldDescription id="email-hint">We will only send a link if this email is registered.</FieldDescription>
          )}
        </Field>
        <SubmitButton>Send reset link</SubmitButton>
        <FieldDescription className="text-center">
          Remembered it? <Link href="/login">Back to log in</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

/** Figma A5 info card: "We sent an email!" + address + expiry. */
export function SentCard({ email, what, expires }: { email: string; what: string; expires: string }) {
  return (
    <div className="flex items-center gap-4 rounded-field border border-warm-200 bg-warm-25 p-4">
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-warm-700 shadow-control">
        <SendIcon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-semibold text-text-primary">We sent an email!</p>
        <p className="truncate text-sm text-text-secondary" data-testid="sent-to">
          {email}
        </p>
        <p className="text-xs text-text-placeholder">
          {what} · Expires in <span className="font-medium text-brand-primary">{expires}</span>
        </p>
      </div>
    </div>
  );
}

// Figma A5 "Link sent".
export function ResetLinkSent({ email }: { email: string }) {
  return (
    <FieldGroup>
      <Dashes active={2} />
      <AuthHeading eyebrow="Almost done" title="Link sent" />
      <SentCard email={email} what="Reset link" expires="30 min" />
      <FieldDescription className="text-center">
        Didn&apos;t receive it? Check your spam folder or <Link href="/forgot-password">try again</Link>.
      </FieldDescription>
    </FieldGroup>
  );
}

function PasswordInput({ id, error, ...props }: React.ComponentProps<"input"> & { id: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={id}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        className="pr-11"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-warm-600 hover:bg-warm-100"
      >
        {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
}

// Figma A6 "Set a new password". An invalid/expired token gets its own state.
export function ResetPasswordForm({ token, invalid }: { token?: string; invalid?: boolean }) {
  const [state, action] = useActionState<AuthState, FormData>(resetPassword, null);
  const fe = state?.fieldErrors ?? {};

  if (invalid || !token) {
    return (
      <FieldGroup>
        <AuthHeading eyebrow="Reset link" title="This link has expired" description="Reset links work once and expire after 30 minutes. Request a new one to continue." />
        <Link
          href="/forgot-password"
          className="flex h-11 items-center justify-center rounded-pill bg-brand-primary font-medium text-white hover:bg-brand-primary-hover"
        >
          Send a new link
        </Link>
      </FieldGroup>
    );
  }

  return (
    <form action={action} noValidate>
      <input type="hidden" name="token" value={token} />
      <FieldGroup>
        <Dashes active={3} />
        <AuthHeading eyebrow="Almost done" title="Set a new password" description="Choose something secure you haven't used before." />
        <FormError message={state?.error ?? fe.token} />
        <Field data-invalid={fe.password ? true : undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput id="password" error={fe.password} required />
          {fe.password ? <FieldMessage id="password-error" message={fe.password} /> : <FieldDescription>Must be at least 8 characters long.</FieldDescription>}
        </Field>
        <Field data-invalid={fe.confirmPassword ? true : undefined}>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <PasswordInput id="confirmPassword" error={fe.confirmPassword} required />
          <FieldMessage id="confirmPassword-error" message={fe.confirmPassword} />
        </Field>
        <SubmitButton>Reset password</SubmitButton>
      </FieldGroup>
    </form>
  );
}

// New screen (Figma has no email-verification step): "check your email" with
// resend. TODO(client): copy.
export function VerifyEmailPanel({ email }: { email: string }) {
  const [state, action] = useActionState<AuthState, FormData>(resendVerification, null);
  const resent = state?.values?.sent === "1";
  return (
    <FieldGroup>
      <AuthHeading eyebrow="Almost done" title="Confirm your email" description="Open the link we sent to finish creating your account." />
      {email && <SentCard email={email} what="Confirmation link" expires="24 hours" />}
      <FormError message={state?.error} />
      {resent && (
        <p role="status" className="rounded-field border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          We sent a new link. It can take a minute to arrive.
        </p>
      )}
      <form action={action}>
        <input type="hidden" name="email" value={email} />
        <FieldDescription className="text-center">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <button type="submit" className="underline underline-offset-4 hover:text-text-primary">
            send it again
          </button>
          .
        </FieldDescription>
      </form>
      <FieldDescription className="text-center">
        Wrong email? <Link href="/signup">Start again</Link>
      </FieldDescription>
    </FieldGroup>
  );
}
