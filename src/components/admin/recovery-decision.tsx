"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { decideRecovery, type RecoveryDecisionState } from "@/server/admin/recovery-actions";

// Move the account (to the address they gave us) or decline with a note.
// Moving signs the account out everywhere and emails a link to choose a
// password; the photo ID is deleted either way. TODO(client): copy.
export function RecoveryDecision({
  id,
  newEmail,
  canMove,
  blockedReason,
  twoFactorEnabled,
}: {
  id: string;
  newEmail: string;
  canMove: boolean;
  blockedReason?: string;
  twoFactorEnabled: boolean;
}) {
  const [decision, setDecision] = useState<"complete" | "decline" | null>(canMove ? null : "decline");
  const [state, action, pending] = useActionState<RecoveryDecisionState, FormData>(async (prev, form) => {
    const result = await decideRecovery(prev, form);
    if (result?.ok) toast.success("Request closed");
    return result;
  }, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision ?? ""} />
      {blockedReason && <p className="rounded-field bg-amber-50 p-3 type-small text-amber-900 ring-1 ring-amber-200 ring-inset">{blockedReason}</p>}
      <div className="flex flex-wrap gap-2">
        {canMove && (
          <Button type="button" variant={decision === "complete" ? "brand" : "secondary"} aria-pressed={decision === "complete"} onClick={() => setDecision("complete")}>
            Move account
          </Button>
        )}
        <Button type="button" variant={decision === "decline" ? "destructive" : "secondary"} aria-pressed={decision === "decline"} onClick={() => setDecision("decline")}>
          Decline
        </Button>
      </div>

      {decision === "complete" && (
        <div className="flex flex-col gap-3 rounded-field bg-warm-50 p-4 type-small text-text-secondary">
          <p>
            The account will use <span className="font-medium break-all text-text-primary">{newEmail}</span>, be logged out everywhere, and get a link to
            choose a new password.
          </p>
          {twoFactorEnabled && (
            <div className="flex items-start gap-2.5">
              <Checkbox id="turnOffTwoFactor" name="turnOffTwoFactor" className="mt-0.5" />
              <Label htmlFor="turnOffTwoFactor" className="type-small font-normal text-text-primary">
                Also turn off two-step login (they lost their authenticator too)
              </Label>
            </div>
          )}
        </div>
      )}
      {decision === "decline" && (
        <label className="flex flex-col gap-2">
          <span className="type-small font-medium text-text-primary">Note for them (sent to {newEmail})</span>
          <Textarea name="note" required placeholder="e.g. The name on the ID doesn't match the account. Reply with a clearer photo and we'll take another look." />
        </label>
      )}
      {state?.error && (
        <p role="alert" className="type-small text-destructive">
          {state.error}
        </p>
      )}
      {decision && (
        <Button type="submit" variant="primary" disabled={pending} className="self-start">
          {pending ? "Saving…" : decision === "complete" ? "Move account and email them" : "Decline and email them"}
        </Button>
      )}
    </form>
  );
}
