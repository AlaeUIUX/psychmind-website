"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUpPatient, signUpProvider, type AuthState } from "@/server/auth/actions";
import { AuthHeading } from "./auth-shell";
import { FieldMessage, FormError, GoogleSignIn, SubmitButton } from "./auth-bits";

function TextField({
  id,
  label,
  error,
  optional,
  ...input
}: React.ComponentProps<"input"> & { id: string; label: string; error?: string; optional?: boolean }) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex items-baseline justify-between">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {optional && <span className="text-sm text-text-placeholder">Optional</span>}
      </div>
      <Input id={id} name={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...input} />
      <FieldMessage id={`${id}-error`} message={error} />
    </Field>
  );
}

// Figma A2 "Create your account" — patient (148:1500) and provider (255:1463).
export function SignUpForm({ role, googleEnabled }: { role: "patient" | "provider"; googleEnabled: boolean }) {
  const [state, action] = useActionState<AuthState, FormData>(role === "provider" ? signUpProvider : signUpPatient, null);
  const fe = state?.fieldErrors ?? {};
  const v = state?.values ?? {};

  return (
    <form action={action} noValidate>
      <FieldGroup className="gap-5">
        <AuthHeading
          step={{ current: 2, total: 2 }}
          title="Create your account"
          description={
            role === "provider" ? "Let's build your professional profile." : "You are one step away from finding your provider."
          }
        />
        <FormError message={state?.error} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="firstName" label="First name" placeholder="John" autoComplete="given-name" defaultValue={v.firstName} error={fe.firstName} required />
          <TextField id="lastName" label="Last name" placeholder="Doe" autoComplete="family-name" defaultValue={v.lastName} error={fe.lastName} required />
        </div>
        {role === "provider" && (
          <>
            <TextField
              id="businessName"
              label="Business name"
              optional
              placeholder="e.g. ThinkWell Therapy Center"
              defaultValue={v.businessName}
              error={fe.businessName}
            />
            <label className="flex cursor-pointer gap-3 rounded-field border border-warm-200 bg-warm-25 p-4 has-data-[state=checked]:border-warm-800">
              <Checkbox name="displayAsBusiness" value="on" className="mt-0.5" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-text-primary">Enlist with business name</span>
                <span className="text-sm text-text-tertiary">
                  Your full name will not show, and your profile will feature the business name
                </span>
              </span>
            </label>
          </>
        )}
        <TextField id="email" label="Email" type="email" placeholder="m@example.com" autoComplete="email" defaultValue={v.email} error={fe.email} required />
        <div className="flex flex-col gap-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="password" label="Password" type="password" autoComplete="new-password" error={fe.password} required />
            <TextField id="confirmPassword" label="Confirm Password" type="password" autoComplete="new-password" error={fe.confirmPassword} required />
          </div>
          {!fe.password && <FieldDescription>Must be at least 8 characters long.</FieldDescription>}
        </div>
        <Field>
          <SubmitButton>Create Account</SubmitButton>
        </Field>
        <GoogleSignIn enabled={googleEnabled} intent={role === "provider" ? "provider" : undefined} />
        <FieldDescription className="text-center">
          Already have an account? <Link href="/login">Sign in</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
