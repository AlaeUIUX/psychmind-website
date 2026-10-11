"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { openBillingPortal, startCheckout, type BillingActionState } from "@/server/billing/actions";

function ActionError({ state }: { state: BillingActionState }) {
  return state?.error ? (
    <p role="alert" className="type-small text-destructive">
      {state.error}
    </p>
  ) : null;
}

/** Checkout, with the automatic renewal terms right beside the button and
 *  their own consent box (lib/billing.ts renewalTerms). TODO(client): copy. */
export function ActivateButton({ disabled, label = "Activate your listing", terms }: { disabled?: boolean; label?: string; terms: string }) {
  const [state, action, pending] = useActionState<BillingActionState, FormData>(startCheckout, null);
  const [agreed, setAgreed] = useState(false);
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4" data-testid="renewal-terms">
      <div className="flex flex-col gap-3 rounded-field border border-warm-200 bg-warm-50 p-4">
        <p className="type-small text-text-primary">
          <span className="font-semibold">Automatic renewal. </span>
          {terms}
        </p>
        <label className="flex items-start gap-2.5 type-small font-medium text-text-primary">
          <Checkbox
            name="renewalConsent"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            disabled={disabled}
            className="mt-0.5"
          />
          I agree that my plan renews automatically until I cancel.
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <Button type="submit" variant="brand" size="md" className="w-fit" disabled={disabled || pending || !agreed} aria-busy={pending || undefined}>
          {pending ? "Opening checkout…" : label}
        </Button>
        <ActionError state={state} />
      </div>
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
