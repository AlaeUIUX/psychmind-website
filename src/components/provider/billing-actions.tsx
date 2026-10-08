"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { openBillingPortal, startCheckout, type BillingActionState } from "@/server/billing/actions";

function ActionError({ state }: { state: BillingActionState }) {
  return state?.error ? (
    <p role="alert" className="type-small text-destructive">
      {state.error}
    </p>
  ) : null;
}

export function ActivateButton({ disabled, label = "Activate your listing" }: { disabled?: boolean; label?: string }) {
  const [state, action, pending] = useActionState<BillingActionState>(startCheckout, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <Button type="submit" variant="brand" size="md" disabled={disabled || pending} aria-busy={pending || undefined}>
        {pending ? "Opening checkout…" : label}
      </Button>
      <ActionError state={state} />
    </form>
  );
}

export function ManageBillingButton({ label = "Manage billing" }: { label?: string }) {
  const [state, action, pending] = useActionState<BillingActionState>(openBillingPortal, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <Button type="submit" variant="secondary" size="md" disabled={pending} aria-busy={pending || undefined}>
        {pending ? "Opening…" : label}
        <ExternalLinkIcon />
      </Button>
      <ActionError state={state} />
    </form>
  );
}
