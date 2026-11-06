"use client";

import { CheckCircle2Icon, LinkIcon } from "@/components/ui/hugeicons";
import Link from "next/link";
import { useActionState } from "react";
import { AuthTitle, FormAlert, SubmitButton } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { confirmRequestEmailAction, type ConfirmRequestEmailState } from "@/server/requests/actions";

// The page behind the link sent to a new requests address
// (server/requests/request-email.ts). Whoever reads that inbox confirms it,
// signed in or not. All copy is new: TODO(client).

/** Where the button after confirming goes: Settings for the provider
 *  themself, otherwise the site. */
type Exit = { href: string; label: string };

/** An expired, used, cancelled or replaced link. */
export function RequestEmailLinkInvalid({ exit }: { exit: Exit }) {
  return (
    <div className="flex flex-col gap-7">
      <span className="flex size-11 items-center justify-center rounded-xl bg-warm-100 text-warm-700">
        <LinkIcon className="size-5" />
      </span>
      <AuthTitle
        title="This link has expired"
        description="Links to confirm an address for session requests work once, for 24 hours. The provider can send a new one from their PsychMind settings."
      />
      <Button asChild fullWidth className="h-10 text-[14px]">
        <Link href={exit.href}>{exit.label}</Link>
      </Button>
    </div>
  );
}

export function ConfirmRequestEmailForm({ token, email, providerName, exit }: { token: string; email: string; providerName: string; exit: Exit }) {
  const [state, action] = useActionState<ConfirmRequestEmailState, FormData>(confirmRequestEmailAction, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <CheckCircle2Icon className="size-5" />
        </span>
        <AuthTitle title="This address is confirmed" description={`New session requests for ${state.providerName} will come to ${state.email}.`} />
        <Button asChild fullWidth className="h-10 text-[14px]">
          <Link href={exit.href}>{exit.label}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <AuthTitle
        eyebrow="Session requests"
        title="Confirm this address"
        description={`${providerName} would like their PsychMind session requests sent here. Each request includes the person's name, contact details and note.`}
      />
      <div className="flex flex-col gap-1 rounded-xl border border-warm-200 p-4">
        <span className="type-ui-caption text-warm-500">Requests will go to</span>
        <span className="break-all type-ui-label text-warm-900" data-testid="request-email-address">
          {email}
        </span>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <FormAlert message={state && !state.ok ? state.error : undefined} />
        <SubmitButton pendingLabel="Confirming…">Confirm this address</SubmitButton>
      </form>
    </div>
  );
}
