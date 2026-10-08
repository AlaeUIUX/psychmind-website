"use client";

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StepActions } from "@/components/onboarding/step-actions";
import { Checkbox } from "@/components/ui/checkbox";
import type { SectionStatus } from "@/lib/provider/completeness";
import { submitForVerification } from "@/server/provider/actions";

// Final step (new — Figma ends at Credentials with no submit or "under
// review" screen). Lists each section with a fix link, then an attestation
// and "Submit for verification". TODO(client): copy.
export function ReviewStep({ sections, backHref }: { sections: SectionStatus[]; backHref: string }) {
  const router = useRouter();
  const [attest, setAttest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ready = sections.every((s) => s.complete);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attest) return setError("Please confirm before submitting.");
    setError(null);
    start(async () => {
      const result = await submitForVerification({ attest: true }).catch(() => null);
      if (result?.ok) {
        router.push(result.redirectTo ?? "/provider/onboarding/submitted");
      } else {
        toast.error(result?.error ?? "We couldn't submit your profile. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y divide-warm-200 rounded-field border border-warm-200">
        {sections.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-2.5 type-small text-text-primary">
              {s.complete ? (
                <CircleCheckIcon aria-hidden className="size-4 text-emerald-600" />
              ) : (
                <CircleAlertIcon aria-hidden className="size-4 text-amber-600" />
              )}
              {s.title}
              <span className="sr-only">{s.complete ? "(complete)" : "(needs attention)"}</span>
            </span>
            <Link
              href={`/provider/onboarding/${s.key}`}
              className="type-small font-medium text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
            >
              {s.complete ? "Edit" : "Finish"}
            </Link>
          </li>
        ))}
      </ul>

      {!ready && (
        <p role="status" className="rounded-field bg-amber-50 px-4 py-3 type-small text-amber-950">
          Finish the sections marked above before submitting.
        </p>
      )}

      <label className="flex gap-3 rounded-field border border-warm-200 bg-warm-25 p-4">
        <Checkbox
          checked={attest}
          onCheckedChange={(v) => setAttest(v === true)}
          disabled={!ready}
          className="mt-0.5"
          aria-describedby={error ? "attest-error" : undefined}
        />
        <span className="type-small text-text-secondary">
          I confirm that the information in my profile is accurate and that I hold a valid, active license in every
          state I listed.
        </span>
      </label>
      {error && (
        <p id="attest-error" role="alert" className="-mt-3 type-small text-destructive">
          {error}
        </p>
      )}

      <StepActions backHref={backHref} submitLabel="Submit for verification" pending={pending} disabled={!ready} />
    </form>
  );
}
