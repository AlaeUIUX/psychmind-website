"use client";

import { CheckCircle2Icon, LinkIcon } from "@/components/ui/hugeicons";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { chooseNewEmail, confirmNewEmail, type ConfirmEmailState, type SettingsState } from "@/server/account/settings-actions";
import { AuthField, AuthTitle, EmailInput, FormAlert, SubmitButton } from "./fields";
import { SentTo } from "./password-forms";

// The two pages behind the links in "Change your email" (Settings): choose
// the new address (after proving the old inbox or the authenticator), then
// confirm it from the new inbox. All copy is new: TODO(client).

/** An expired, used or someone else's link. */
export function EmailLinkInvalid({ settingsHref }: { settingsHref: string }) {
  return (
    <div className="flex flex-col gap-7">
      <span className="flex size-11 items-center justify-center rounded-xl bg-warm-100 text-warm-700">
        <LinkIcon className="size-5" />
      </span>
      <AuthTitle title="This link has expired" description="Links to change your email work once, for 30 minutes. Start again from Settings to get a new one." />
      <Button asChild fullWidth className="h-10 text-[14px]">
        <Link href={settingsHref}>Go to Settings</Link>
      </Button>
    </div>
  );
}

/** Step 2: "Choose your new email", from the link sent to the current address. */
export function ChooseNewEmailForm({ token, currentEmail }: { token: string; currentEmail: string }) {
  const [state, action] = useActionState<SettingsState, FormData>(chooseNewEmail, null);
  const fe = state?.fieldErrors ?? {};

  if (state?.ok && state.sentTo) {
    return (
      <div className="flex flex-col gap-7">
        <AuthTitle eyebrow="Almost done" title="Confirm your new email" description="Open the link we sent to your new address. Your email changes once you confirm it." />
        <SentTo email={state.sentTo} what="Confirmation link" expires="30 min" />
        <p className="type-ui-small text-warm-600">Until then, keep logging in with {currentEmail}.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <AuthTitle eyebrow="It's you" title="Choose your new email" description={`Your account uses ${currentEmail} today. We'll send a link to the new address to confirm it.`} />
      <form action={action} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <FormAlert message={state?.error} />
        <AuthField id="email" label="New email" error={fe.email}>
          <EmailInput error={fe.email} autoFocus />
        </AuthField>
        <SubmitButton pendingLabel="Sending…">Send confirmation link</SubmitButton>
      </form>
    </div>
  );
}

/** Step 3: the button behind the link sent to the new address. */
export function ConfirmNewEmailForm({ token, newEmail, signedIn }: { token: string; newEmail: string; signedIn: boolean }) {
  const [state, action] = useActionState<ConfirmEmailState, FormData>(confirmNewEmail, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <CheckCircle2Icon className="size-5" />
        </span>
        <AuthTitle title="Your email is changed" description={`From now on, log in with ${state.email}. We let your old address know.`} />
        <Button asChild fullWidth className="h-10 text-[14px]">
          <Link href={signedIn ? (state.home ?? "/") : "/login"}>{signedIn ? "Back to Settings" : "Log in"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <AuthTitle eyebrow="Last step" title="Confirm your new email" description="Your PsychMind account will use this address from now on." />
      <div className="flex flex-col gap-1 rounded-xl border border-warm-200 p-4">
        <span className="type-ui-caption text-warm-500">New email</span>
        <span className="break-all type-ui-label text-warm-900" data-testid="new-email">
          {newEmail}
        </span>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <FormAlert message={state?.error} />
        <SubmitButton pendingLabel="Confirming…">Confirm new email</SubmitButton>
      </form>
    </div>
  );
}
