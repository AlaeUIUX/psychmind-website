"use client";

import { CheckCircle2Icon, LinkIcon, ShieldCheckIcon } from "@/components/ui/hugeicons";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { confirmRecoveryContactAction, disputeRecoveryAction, type RecoveryLinkState } from "@/server/account/recovery-actions";
import { AuthTitle, FormAlert, SubmitButton } from "./fields";

// The two account-recovery links (server/account/recovery.ts): the requester
// confirms their new address; the account's owner can say "This wasn't me".
// Nothing happens until the button is pressed. Copy approved by the owner, 2026-11-10.

export function RecoveryLinkInvalid() {
  return (
    <div className="flex flex-col gap-7">
      <span className="flex size-11 items-center justify-center rounded-xl bg-warm-100 text-warm-700">
        <LinkIcon className="size-5" />
      </span>
      <AuthTitle title="This link has expired" description="It was already used, or it's too old. If you still need help, send a new request." />
      <Button asChild fullWidth className="h-10 text-[14px]">
        <Link href="/account-recovery">Account recovery</Link>
      </Button>
    </div>
  );
}

export function ConfirmRecoveryContactForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState<RecoveryLinkState, FormData>(confirmRecoveryContactAction, null);
  if (state?.ok) {
    return (
      <div className="flex flex-col gap-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <CheckCircle2Icon className="size-5" />
        </span>
        <AuthTitle
          title="Your request is with our team"
          description="Our support team will check your details and reply to this address, usually within 2 business days. For your security, nothing on any account changes until a person has verified who you are."
        />
        <Button asChild variant="secondary" fullWidth className="h-10 text-[14px]">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-7">
      <AuthTitle eyebrow="Account recovery" title="Confirm this address" description="Confirm it's yours, and your request goes to our support team." />
      <div className="flex flex-col gap-1 rounded-xl border border-warm-200 p-4">
        <span className="type-ui-caption text-warm-500">We&apos;ll reply to</span>
        <span className="break-all type-ui-label text-warm-900">{email}</span>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <FormAlert message={state && !state.ok ? state.error : undefined} />
        <SubmitButton pendingLabel="Confirming…">Confirm and send my request</SubmitButton>
      </form>
    </div>
  );
}

export function DisputeRecoveryForm({ token }: { token: string }) {
  const [state, action] = useActionState<RecoveryLinkState, FormData>(disputeRecoveryAction, null);
  if (state?.ok) {
    return (
      <div className="flex flex-col gap-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <ShieldCheckIcon className="size-5" />
        </span>
        <AuthTitle
          title={state.alreadyClosed ? "This request is already closed" : "Done. The request is cancelled"}
          description="Your account stays as it is. To keep it safe, log in and turn on two-step login in Settings, and change your password if you think someone knows it."
        />
        <Button asChild fullWidth className="h-10 text-[14px]">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-7">
      <AuthTitle
        eyebrow="Account recovery"
        title="Didn't ask to move your account?"
        description="Someone asked our support team to move your PsychMind account to a different email address. Cancel it, and nothing changes."
      />
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <FormAlert message={state && !state.ok ? state.error : undefined} />
        <SubmitButton pendingLabel="Cancelling…">This wasn&apos;t me: cancel the request</SubmitButton>
      </form>
    </div>
  );
}
