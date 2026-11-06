"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setExtraLocations, type DecisionState } from "@/server/admin/actions";

// Extra practice locations on a provider's plan, added by the team until they
// can be bought online (D9). TODO(client): copy.
export function ExtraLocationsForm({ profileId, extra }: { profileId: string; extra: number }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(async (prev, form) => {
    const result = await setExtraLocations(prev, form);
    if (result?.ok) toast.success("Locations saved");
    return result;
  }, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="profileId" value={profileId} />
      <label htmlFor="extra-locations" className="type-small text-text-tertiary">
        Extra locations
      </label>
      <div className="flex items-center gap-2">
        <Input
          id="extra-locations"
          name="extra"
          type="number"
          inputMode="numeric"
          min={0}
          max={50}
          defaultValue={extra}
          className="w-24"
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "extra-locations-error" : undefined}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={pending} aria-busy={pending || undefined}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {state?.error && (
        <p id="extra-locations-error" role="alert" className="type-small text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
