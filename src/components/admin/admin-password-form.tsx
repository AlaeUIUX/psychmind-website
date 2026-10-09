"use client";

import { useActionState } from "react";
import { AuthField, AuthTitle, FormAlert, PasswordInput, SubmitButton, TextInput } from "@/components/auth/fields";
import { setAdminPassword, type AdminPasswordState } from "@/server/admin/account-actions";

// A new admin's first log-in: their name, then a password of their own in
// place of the temporary one. Two-step login comes next. TODO(client): copy.
export function AdminPasswordForm({ email, firstName, lastName }: { email: string; firstName: string; lastName: string }) {
  const [state, action] = useActionState<AdminPasswordState, FormData>(setAdminPassword, null);
  const fe = state?.fieldErrors ?? {};
  return (
    <div className="flex flex-col gap-7">
      <AuthTitle
        eyebrow="First log-in"
        title="Choose your password"
        description={`Replace the temporary password for ${email}. Next, you'll set up an authenticator app.`}
      />
      <form action={action} noValidate className="flex flex-col gap-4">
        <FormAlert message={state?.error} />
        <div className="grid grid-cols-2 gap-3">
          <AuthField id="firstName" label="First name" error={fe.firstName}>
            <TextInput id="firstName" error={fe.firstName} defaultValue={state?.values?.firstName ?? firstName} autoComplete="given-name" autoFocus />
          </AuthField>
          <AuthField id="lastName" label="Last name" error={fe.lastName}>
            <TextInput id="lastName" error={fe.lastName} defaultValue={state?.values?.lastName ?? lastName} autoComplete="family-name" />
          </AuthField>
        </div>
        <AuthField id="password" label="New password" error={fe.password} hint="At least 12 characters. Not the temporary one.">
          <PasswordInput error={fe.password} meter autoComplete="new-password" />
        </AuthField>
        <SubmitButton pendingLabel="Saving…">Save and continue</SubmitButton>
      </form>
    </div>
  );
}
