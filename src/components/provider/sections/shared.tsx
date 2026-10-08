"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { StepActions } from "@/components/onboarding/step-actions";
import { useOptionalOnboarding } from "@/components/onboarding/onboarding-context";
import { zodResolver } from "@/lib/forms/zod-resolver";
import type { ActionResult, ProviderState } from "@/lib/provider/state";
import type { ProfileView } from "@/lib/provider/types";
import { saveProviderSection, type SectionKey } from "@/server/provider/actions";

export type SectionMode = "wizard" | "editor";

export type SectionProps = {
  state: ProviderState;
  mode: SectionMode;
  /** Live preview updates while typing. */
  onPreview?: (patch: Partial<ProfileView>) => void;
  /** Wizard: where "Go back" and a successful save lead. */
  backHref?: string | null;
  nextHref?: string;
};

/** react-hook-form + Zod + the save action, with server field errors mapped
 *  back onto the form and the right follow-up for wizard vs editor. */
export function useSectionForm<S extends z.ZodType<FieldValues, FieldValues>>({
  section,
  schema,
  defaultValues,
  mode,
  nextHref,
  toPreview,
  onPreview,
}: {
  section: SectionKey;
  schema: S;
  defaultValues: DefaultValues<z.input<S>>;
  mode: SectionMode;
  nextHref?: string;
  toPreview?: (values: z.input<S>) => Partial<ProfileView>;
  onPreview?: (patch: Partial<ProfileView>) => void;
}) {
  const router = useRouter();
  const onboarding = useOptionalOnboarding();
  const [pending, startTransition] = useTransition();
  const form = useForm<z.input<S>, unknown, z.output<S>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    if (!toPreview || !onPreview) return;
    const sub = form.watch((values) => onPreview(toPreview(values as z.input<S>)));
    return () => sub.unsubscribe();
  }, [form, toPreview, onPreview]);

  const applyResult = (result: ActionResult) => {
    if (result.ok) {
      onboarding?.markSaved();
      if (mode === "wizard" && (result.redirectTo || nextHref)) {
        router.push(result.redirectTo ?? nextHref!);
      } else {
        toast.success("Changes saved");
        form.reset(form.getValues());
        router.refresh();
      }
      return;
    }
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      form.setError(field as Path<z.input<S>>, { message });
    }
    toast.error(result.error ?? "Please fix the highlighted fields.");
  };

  const onSubmit = form.handleSubmit(() => {
    // Send the raw input: the server parses it with the same schema.
    const values = form.getValues();
    startTransition(async () => {
      try {
        applyResult(await saveProviderSection(section, values));
      } catch {
        toast.error("We couldn't save your changes. Check your connection and try again.");
      }
    });
  });

  return { form, onSubmit, pending };
}

/** Wizard: Go back / Save and continue. Editor: a single Save changes. */
export function SectionFooter({
  mode,
  backHref,
  pending,
  dirty = true,
  disabled,
}: {
  mode: SectionMode;
  backHref?: string | null;
  pending: boolean;
  dirty?: boolean;
  disabled?: boolean;
}) {
  if (mode === "wizard") return <StepActions backHref={backHref} pending={pending} disabled={disabled} />;
  return (
    <div className="flex items-center justify-end gap-3 border-t border-warm-200 pt-6">
      {!dirty && <span className="type-small text-text-placeholder">All changes saved</span>}
      <Button type="submit" variant="primary" disabled={pending || !dirty || disabled} aria-busy={pending || undefined}>
        {pending && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

/** First error message for a (possibly nested) field path. */
export function errorAt(errors: unknown, path: string): string | undefined {
  let node = errors as Record<string, unknown> | undefined;
  for (const key of path.split(".")) node = node?.[key] as Record<string, unknown> | undefined;
  return (node as { message?: string } | undefined)?.message;
}
