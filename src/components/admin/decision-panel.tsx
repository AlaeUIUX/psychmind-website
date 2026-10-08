"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProviderStatus } from "@/lib/provider/types";
import { decideProvider, type DecisionState } from "@/server/admin/actions";

type Decision = "approve" | "request_changes" | "reject" | "suspend" | "unsuspend";

// Approve / Request changes / Reject (submitted), Suspend (verified),
// Unsuspend (suspended). Anything but approval needs a note for the provider.
export function DecisionPanel({ profileId, status, needsReview }: { profileId: string; status: ProviderStatus; needsReview: boolean }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [state, action, pending] = useActionState<DecisionState, FormData>(async (prev, form) => {
    const result = await decideProvider(prev, form);
    if (result?.ok) {
      toast.success("Decision saved");
      setDecision(null);
    }
    return result;
  }, null);

  const options: { value: Decision; label: string; variant: "brand" | "secondary" | "destructive" }[] =
    status === "submitted"
      ? [
          { value: "approve", label: "Approve", variant: "brand" },
          { value: "request_changes", label: "Request changes", variant: "secondary" },
          { value: "reject", label: "Reject", variant: "destructive" },
        ]
      : status === "approved"
        ? [
            ...(needsReview ? [{ value: "approve" as const, label: "Approve license changes", variant: "brand" as const }] : []),
            { value: "suspend", label: "Suspend", variant: "destructive" },
          ]
        : status === "suspended"
          ? [{ value: "unsuspend", label: "Unsuspend", variant: "secondary" }]
          : [];

  if (!options.length) return <p className="type-small text-text-tertiary">No decision needed right now.</p>;
  const needsNote = decision && decision !== "approve" && decision !== "unsuspend";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="decision" value={decision ?? ""} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o.value}
            type="button"
            variant={decision === o.value ? o.variant : "secondary"}
            aria-pressed={decision === o.value}
            onClick={() => setDecision(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
      {needsNote && (
        <label className="flex flex-col gap-2">
          <span className="type-small font-medium text-text-primary">Note for the provider (they&apos;ll see this)</span>
          <Textarea name="note" required placeholder="e.g. The license number doesn't match the Texas board record. Please upload a clearer copy." />
        </label>
      )}
      {state?.error && (
        <p role="alert" className="type-small text-destructive">
          {state.error}
        </p>
      )}
      {decision && (
        <Button type="submit" variant="primary" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Confirm decision"}
        </Button>
      )}
    </form>
  );
}
