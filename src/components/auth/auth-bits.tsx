"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FieldError, FieldSeparator } from "@/components/ui/field";
import { authClient } from "@/lib/auth/client";

/** Primary submit for auth forms, with a pending state. */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" fullWidth disabled={pending} aria-busy={pending || undefined}>
      {pending && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {children}
    </Button>
  );
}

/** Form-level error (wrong password, rate limited…), announced to screen readers. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-field border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
      {message}
    </div>
  );
}

export function FieldMessage({ id, message }: { id: string; message?: string }) {
  return message ? <FieldError id={id}>{message}</FieldError> : null;
}

/** "Or continue with" + Google (Figma: icon-only button on sign-up, labelled on login). */
export function GoogleSignIn({
  enabled,
  intent,
  label,
}: {
  enabled: boolean;
  /** "provider" when the person picked "I am a provider" first. */
  intent?: "provider";
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: intent ? `/auth/continue?intent=${intent}` : "/auth/continue",
      errorCallbackURL: "/login?error=google",
    });
    if (error) {
      setError("Google sign-in didn't work. Please try again or use your email.");
      setPending(false);
    }
  };

  return (
    <>
      <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>
      <Button
        variant="secondary"
        type="button"
        fullWidth
        onClick={go}
        disabled={!enabled || pending}
        aria-label={label ? undefined : "Continue with Google"}
        title={enabled ? undefined : "Google sign-in isn't set up yet"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/login/google-icon.svg" alt="" width={16} height={16} />
        {label}
      </Button>
      {!enabled && process.env.NODE_ENV !== "production" && (
        <p className="text-center type-caption text-text-placeholder">
          Dev: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google sign-in.
        </p>
      )}
      {error && <FormError message={error} />}
    </>
  );
}
