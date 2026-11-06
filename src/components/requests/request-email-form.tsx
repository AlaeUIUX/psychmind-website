"use client";

import { LoaderCircleIcon, MailIcon } from "@/components/ui/hugeicons";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelRequestEmailChange, resendRequestEmailLink, setRequestEmail, type RequestEmailState } from "@/server/requests/actions";

// Provider settings: where session requests are emailed (an assistant or the
// practice inbox). Empty means the account email. A new address waits for its
// inbox to confirm it (server/requests/request-email.ts). TODO(client): copy.
export function RequestEmailForm({ confirmed, pending, accountEmail }: { confirmed: string | null; pending: string | null; accountEmail: string }) {
  const [state, action, saving] = useActionState<RequestEmailState, FormData>(setRequestEmail, null);
  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="requestEmail" className="type-ui-label text-text-primary">
            Send session requests to
          </label>
          <p className="type-ui-small text-text-tertiary">
            An assistant or your practice inbox, for example. Leave it empty to use {accountEmail}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            // Shows where requests go now; re-read after a save or cancel.
            key={`${confirmed}|${pending}`}
            id="requestEmail"
            name="requestEmail"
            type="email"
            defaultValue={confirmed ?? ""}
            placeholder={accountEmail}
            aria-invalid={!!state?.error}
            className="h-10 sm:max-w-[360px]"
          />
          <Button type="submit" variant="secondary" disabled={saving} className="h-10 px-4 text-[13px]">
            {saving && <LoaderCircleIcon className="animate-spin" />}
            Save
          </Button>
        </div>
        {state?.error && (
          <p role="alert" className="type-ui-caption text-red-700">
            {state.error}
          </p>
        )}
        {state?.ok && !state.sentTo && (
          <p role="status" className="type-ui-caption text-emerald-700">
            Saved. New requests go to this address.
          </p>
        )}
      </form>
      {pending && <PendingAddress pending={pending} current={confirmed ?? accountEmail} />}
    </div>
  );
}

/** A new address waiting for its link: requests still go to the current one. */
function PendingAddress({ pending, current }: { pending: string; current: string }) {
  const [resent, resend, resending] = useActionState<RequestEmailState, FormData>(resendRequestEmailLink, null);
  const [cancelled, cancel, cancelling] = useActionState<RequestEmailState, FormData>(cancelRequestEmailChange, null);
  const error = resent?.error ?? cancelled?.error;
  return (
    <div className="flex flex-col gap-3 rounded-field border border-warm-900/10 bg-warm-900/[0.04] px-4 py-3" data-testid="request-email-pending">
      <div className="flex gap-3 type-ui-small text-warm-900/70">
        <MailIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-warm-900/50" />
        <p>
          <span className="font-medium break-all text-warm-900">Waiting for {pending} to confirm.</span> We emailed it a link, valid for 24 hours. Until
          someone opens it, requests go to <span className="break-all">{current}</span>.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-7">
        <form action={resend}>
          <Button type="submit" variant="secondary" size="sm" disabled={resending || cancelling}>
            {resending && <LoaderCircleIcon className="animate-spin" />}
            Resend link
          </Button>
        </form>
        <form action={cancel}>
          <Button type="submit" variant="ghost" size="sm" disabled={resending || cancelling}>
            {cancelling && <LoaderCircleIcon className="animate-spin" />}
            Cancel
          </Button>
        </form>
        {resent?.ok && (
          <span role="status" className="type-ui-caption text-emerald-700">
            Sent a new link.
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="pl-7 type-ui-caption text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
