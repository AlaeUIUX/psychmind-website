"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setRequestEmail, type RequestEmailState } from "@/server/requests/actions";

// Provider settings: where session requests are emailed (an assistant or the
// practice inbox). Empty means the account email. TODO(client): copy.
export function RequestEmailForm({ current, accountEmail }: { current: string | null; accountEmail: string }) {
  const [state, action, pending] = useActionState<RequestEmailState, FormData>(setRequestEmail, null);
  return (
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
          id="requestEmail"
          name="requestEmail"
          type="email"
          defaultValue={current ?? ""}
          placeholder={accountEmail}
          aria-invalid={!!state?.error}
          className="h-10 shadow-none sm:max-w-[360px]"
        />
        <Button type="submit" variant="secondary" disabled={pending} className="h-10 px-4 text-[13px]">
          {pending && <LoaderCircleIcon className="animate-spin" />}
          Save
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="type-ui-caption text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="type-ui-caption text-emerald-700">
          Saved. New requests go to this address.
        </p>
      )}
    </form>
  );
}
