"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { LEAVE_BACK, UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";
import { StepActions } from "@/components/onboarding/step-actions";
import { useOptionalOnboarding, useUploadingFlag } from "@/components/onboarding/onboarding-context";
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
  uploading,
}: {
  section: SectionKey;
  schema: S;
  defaultValues: DefaultValues<z.input<S>>;
  mode: SectionMode;
  nextHref?: string;
  toPreview?: (values: z.input<S>) => Partial<ProfileView>;
  onPreview?: (patch: Partial<ProfileView>) => void;
  /** A file is still uploading: saving waits for it (also blocks ⌘/Ctrl + Enter). */
  uploading?: boolean;
}) {
  const router = useRouter();
  const onboarding = useOptionalOnboarding();
  const [pending, startTransition] = useTransition();
  const form = useForm<z.input<S>, unknown, z.output<S>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
    // FormErrorSummary takes focus after a failed save and links to each field.
    shouldFocusError: false,
  });
  // "Save and leave" from the unsaved-changes dialog: where to go once saved.
  const leaveTo = useRef<string | null>(null);

  useEffect(() => {
    if (!toPreview || !onPreview) return;
    const sub = form.watch((values) => onPreview(toPreview(values as z.input<S>)));
    return () => sub.unsubscribe();
  }, [form, toPreview, onPreview]);

  const applyResult = (result: ActionResult) => {
    if (result.ok) {
      onboarding?.markSaved();
      const destination = leaveTo.current;
      leaveTo.current = null;
      if (destination) {
        // Saved: nothing is unsaved any more, so the guard lets this through.
        form.reset(form.getValues());
        if (destination === LEAVE_BACK) window.history.back();
        else router.push(destination);
      } else if (mode === "wizard" && (result.redirectTo || nextHref)) {
        form.reset(form.getValues());
        router.push(result.redirectTo ?? nextHref!);
      } else {
        toast.success("Changes saved");
        form.reset(form.getValues());
        router.refresh();
      }
      return;
    }
    leaveTo.current = null;
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      form.setError(field as Path<z.input<S>>, { message });
    }
    toast.error(result.error ?? "Please fix the highlighted fields.");
  };

  const submit = form.handleSubmit(
    () => {
    // Send the raw input: the server parses it with the same schema.
    const values = form.getValues();
    startTransition(async () => {
      try {
        applyResult(await saveProviderSection(section, values));
      } catch {
        toast.error("We couldn't save your changes. Check your connection and try again.");
      }
    });
    },
    () => {
      leaveTo.current = null;
    },
  );

  const onSubmit = (e?: React.BaseSyntheticEvent) => {
    const formEl = e?.target as HTMLFormElement | undefined;
    if (formEl?.dataset?.leaveTo) {
      leaveTo.current = formEl.dataset.leaveTo;
      delete formEl.dataset.leaveTo;
    }
    if (uploading) {
      e?.preventDefault();
      return Promise.resolve();
    }
    return submit(e);
  };

  return { form, onSubmit, pending };
}

/** Wizard: Go back / Save and continue. Editor: a single Save changes.
 *  Both wait while a file is uploading. */
export function SectionFooter({
  mode,
  backHref,
  pending,
  uploading = false,
  dirty = true,
  unsaved = dirty,
  disabled,
}: {
  mode: SectionMode;
  backHref?: string | null;
  pending: boolean;
  uploading?: boolean;
  dirty?: boolean;
  /** Changes that would be lost by leaving (defaults to dirty). */
  unsaved?: boolean;
  disabled?: boolean;
}) {
  useUploadingFlag(uploading);
  const anchor = useRef<HTMLSpanElement>(null);
  // Leaving with unsaved changes asks first, and can save on the way out.
  const guard = (
    <>
      <span ref={anchor} hidden />
      <UnsavedChangesGuard
        when={unsaved && !pending}
        saving={pending}
        onSaveAndLeave={(href) => {
          const formEl = anchor.current?.closest("form");
          if (!formEl) return;
          formEl.dataset.leaveTo = href;
          formEl.requestSubmit();
        }}
      />
    </>
  );
  if (mode === "wizard")
    return (
      <>
        {guard}
        <StepActions backHref={backHref} pending={pending} uploading={uploading} disabled={disabled} />
      </>
    );
  return (
    <div className="flex items-center justify-end gap-3 border-t border-warm-200 pt-6">
      {guard}
      {!dirty && !uploading && <span className="type-small text-text-placeholder">All changes saved</span>}
      <Button type="submit" variant="primary" disabled={pending || uploading || !dirty || disabled} aria-busy={pending || uploading || undefined}>
        {(pending || uploading) && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />}
        {/* TODO(client): "Uploading…" */}
        {pending ? "Saving…" : uploading ? "Uploading…" : "Save changes"}
      </Button>
    </div>
  );
}

/** First error message for a (possibly nested) field path. */
/** Whether anything under `path` has an error (e.g. any field of locations.1). */
export function hasErrorAt(errors: unknown, path: string): boolean {
  let node = errors as Record<string, unknown> | undefined;
  for (const key of path.split(".")) node = node?.[key] as Record<string, unknown> | undefined;
  return !!node && typeof node === "object" && Object.keys(node).length > 0;
}

export function errorAt(errors: unknown, path: string): string | undefined {
  let node = errors as Record<string, unknown> | undefined;
  for (const key of path.split(".")) node = node?.[key] as Record<string, unknown> | undefined;
  return (node as { message?: string } | undefined)?.message;
}
