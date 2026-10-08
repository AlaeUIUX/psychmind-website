"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn, type AuthState } from "@/server/auth/actions";
import { AuthHeading } from "./auth-shell";
import { FieldMessage, FormError, GoogleSignIn, SubmitButton } from "./auth-bits";

// Figma A3 "Log in to PsychMind".
export function LoginForm({ next, googleEnabled, notice }: { next?: string; googleEnabled: boolean; notice?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FieldGroup>
        <AuthHeading
          eyebrow="Welcome back"
          title="Log in to PsychMind"
          description="Good to see you again. Pick up right where you left off."
        />
        {notice && (
          <p role="status" className="rounded-field border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {notice}
          </p>
        )}
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
            aria-describedby={fe.email ? "email-error" : undefined}
            required
          />
          <FieldMessage id="email-error" message={fe.email} />
        </Field>
        <Field data-invalid={fe.password ? true : undefined}>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link href="/forgot-password" className="ml-auto text-sm text-muted-foreground underline-offset-2 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={!!fe.password}
            aria-describedby={fe.password ? "password-error" : undefined}
            required
          />
          <FieldMessage id="password-error" message={fe.password} />
        </Field>
        <Field>
          <SubmitButton>Continue</SubmitButton>
        </Field>
        <GoogleSignIn enabled={googleEnabled} label="Continue with Google" />
        <FieldDescription className="text-center">
          Don&apos;t have an account? <Link href="/signup">Create account</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
