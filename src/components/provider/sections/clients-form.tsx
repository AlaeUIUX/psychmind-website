"use client";

import { useCallback } from "react";
import { Controller } from "react-hook-form";
import { ChoiceChips } from "@/components/app/choice-chips";
import { clientsSchema, type ClientsInput } from "@/lib/provider/schema";
import { AGE_GROUPS, SESSION_PARTICIPANTS } from "@/lib/taxonomy";
import { SectionFooter, type SectionProps, useSectionForm } from "./shared";

function ChipField({ label, hint, error, field, children }: { label: string; hint: string; error?: string; field?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3" data-field={field}>
      <legend className="mb-1 text-sm font-medium text-text-primary">
        {label} <span aria-hidden className="text-destructive">*</span>
      </legend>
      <p className="-mt-1 type-small text-text-tertiary">{hint}</p>
      {children}
      {error && (
        <p role="alert" className="type-small text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

// Figma P4a "Your expertise": who the provider sees.
export function ClientsForm({ state, mode, onPreview, backHref, nextHref }: SectionProps) {
  const toPreview = useCallback(
    (v: ClientsInput) => ({ sessionParticipants: v.sessionParticipants ?? [], ageGroups: v.ageGroups ?? [] }),
    [],
  );
  const { form, onSubmit, pending } = useSectionForm({
    section: "clients",
    schema: clientsSchema,
    mode,
    nextHref,
    onPreview,
    toPreview,
    defaultValues: {
      sessionParticipants: state.sessionParticipants as ClientsInput["sessionParticipants"],
      ageGroups: state.ageGroups as ClientsInput["ageGroups"],
    },
  });
  const e = form.formState.errors;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <Controller
        control={form.control}
        name="sessionParticipants"
        render={({ field }) => (
          <ChipField label="Session participants" hint="Choose all that apply" error={e.sessionParticipants?.message} field="sessionParticipants">
            <ChoiceChips
              label="Session participants"
              options={[...SESSION_PARTICIPANTS]}
              value={field.value ?? []}
              onValueChange={(v) => field.onChange(v)}
            />
          </ChipField>
        )}
      />
      <Controller
        control={form.control}
        name="ageGroups"
        render={({ field }) => (
          <ChipField label="Age groups served" hint="Choose all that apply" error={e.ageGroups?.message} field="ageGroups">
            <ChoiceChips label="Age groups served" options={[...AGE_GROUPS]} value={field.value ?? []} onValueChange={(v) => field.onChange(v)} />
          </ChipField>
        )}
      />
      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={form.formState.isDirty} />
    </form>
  );
}

export { ChipField };
