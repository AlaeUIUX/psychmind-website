"use client";

import { cn } from "cn";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { signUpPatient, signUpProvider, type AuthState } from "@/server/auth/actions";
import { useAuthPanel } from "./auth-context";
import { GoogleSignIn } from "./auth-bits";
import { AuthField, AuthTitle, EmailInput, FormAlert, OrDivider, PasswordInput, SubmitButton, TextInput } from "./fields";

// Figma A2 "Create your account", streamlined: one password field with
// show/hide and a strength meter instead of "Confirm Password", the business
// name tucked behind a switch, and — for providers — the profile card in the
// portal panel fills in as they type.
export function SignUpForm({ role, googleEnabled }: { role: "patient" | "provider"; googleEnabled: boolean }) {
  const [state, action] = useActionState<AuthState, FormData>(role === "provider" ? signUpProvider : signUpPatient, null);
  const fe = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  const { setRole, setDraft } = useAuthPanel();
  const [business, setBusiness] = useState(Boolean(v.businessName));
  const [showBusiness, setShowBusiness] = useState(false);

  useEffect(() => setRole(role), [role, setRole]);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4">
        <Link href="/signup" className="inline-flex w-fit items-center gap-1.5 type-ui-small text-warm-500 hover:text-warm-900">
          <ArrowLeftIcon className="size-3.5" />
          Step 2 of 2
        </Link>
        <AuthTitle
          title="Create your account"
          description={role === "provider" ? "Let's build your professional profile." : "You are one step away from finding your provider."}
        />
      </div>

      <GoogleSignIn enabled={googleEnabled} intent={role === "provider" ? "provider" : undefined} />
      <OrDivider />

      <form action={action} noValidate className="flex flex-col gap-4">
        <FormAlert message={state?.error} />
        <div className="grid grid-cols-2 gap-3">
          <AuthField id="firstName" label="First name" error={fe.firstName}>
            <TextInput
              id="firstName"
              placeholder="John"
              autoComplete="given-name"
              defaultValue={v.firstName}
              error={fe.firstName}
              autoFocus
              onChange={(e) => setDraft({ firstName: e.target.value })}
            />
          </AuthField>
          <AuthField id="lastName" label="Last name" error={fe.lastName}>
            <TextInput
              id="lastName"
              placeholder="Doe"
              autoComplete="family-name"
              defaultValue={v.lastName}
              error={fe.lastName}
              onChange={(e) => setDraft({ lastName: e.target.value })}
            />
          </AuthField>
        </div>

        {role === "provider" && (
          <div className="flex flex-col gap-3 rounded-xl border border-warm-200 p-3.5">
            <label className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span className="type-ui-label text-warm-800">I practice under a business name</span>
                <span className="type-ui-caption text-warm-500">e.g. a group practice or clinic</span>
              </span>
              <Switch checked={business} onCheckedChange={setBusiness} aria-label="I practice under a business name" />
            </label>
            <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out-soft", business ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="flex flex-col gap-3 overflow-hidden">
                <AuthField id="businessName" label="Business name" error={fe.businessName} className="pt-1">
                  <TextInput
                    id="businessName"
                    name={business ? "businessName" : undefined}
                    placeholder="e.g. ThinkWell Therapy Center"
                    defaultValue={v.businessName}
                    error={fe.businessName}
                    tabIndex={business ? 0 : -1}
                    onChange={(e) => setDraft({ businessName: e.target.value })}
                  />
                </AuthField>
                <label className="flex items-start gap-3">
                  <Switch
                    checked={showBusiness}
                    onCheckedChange={(on) => {
                      setShowBusiness(on);
                      setDraft({ displayAsBusiness: on });
                    }}
                    tabIndex={business ? 0 : -1}
                    className="mt-0.5"
                    aria-label="Enlist with business name"
                  />
                  <span className="flex flex-col">
                    <span className="type-ui-label text-warm-800">Enlist with business name</span>
                    <span className="type-ui-caption text-warm-500">Your full name will not show, and your profile will feature the business name</span>
                  </span>
                </label>
                {business && showBusiness && <input type="hidden" name="displayAsBusiness" value="on" />}
              </div>
            </div>
          </div>
        )}

        <AuthField id="email" label="Email" error={fe.email}>
          <EmailInput error={fe.email} defaultValue={v.email} />
        </AuthField>
        <AuthField id="password" label="Password" error={fe.password} hint="Must be at least 8 characters long.">
          <PasswordInput error={fe.password} meter autoComplete="new-password" />
        </AuthField>
        <div className="pt-1">
          <SubmitButton pendingLabel="Creating your account…">Create account</SubmitButton>
        </div>
        <p className="type-ui-caption text-warm-500">
          By clicking continue, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-warm-900">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-warm-900">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
