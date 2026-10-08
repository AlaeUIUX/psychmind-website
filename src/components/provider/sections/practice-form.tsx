"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { FormRow, describedBy } from "@/components/forms/form-row";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { practiceSchema, type PracticeInput } from "@/lib/provider/schema";
import { GENDERS } from "@/lib/taxonomy";
import { SectionFooter, type SectionProps, errorAt, useSectionForm } from "./shared";

const toNumber = (v: unknown) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));

// New step (build plan D2): fields the patient side filters on or shows —
// gender, fees, education — that Figma's onboarding never collects.
// TODO(client): labels and helper copy.
export function PracticeForm({ state, mode, onPreview, backHref, nextHref }: SectionProps) {
  const toPreview = useCallback(
    (v: PracticeInput) => ({
      gender: v.gender || null,
      feeIndividual: toNumber(v.feeIndividual),
      feeCouples: toNumber(v.feeCouples),
      slidingScale: !!v.slidingScale,
      acceptingNewClients: v.acceptingNewClients !== false,
      education: (v.education ?? [])
        .filter((ed) => ed?.degree || ed?.school)
        .map((ed) => ({ degree: ed.degree ?? "", school: ed.school ?? "", year: toNumber(ed.year) })),
    }),
    [],
  );
  const { form, onSubmit, pending } = useSectionForm({
    section: "practice",
    schema: practiceSchema,
    mode,
    nextHref,
    onPreview,
    toPreview,
    defaultValues: {
      gender: (state.gender || "") as PracticeInput["gender"],
      feeIndividual: state.feeIndividual ?? "",
      feeCouples: state.feeCouples ?? "",
      slidingScale: state.slidingScale,
      acceptingNewClients: state.acceptingNewClients,
      education: state.education.map((e) => ({ ...e, year: e.year ?? "" })),
    },
  });
  const { register, control, formState } = form;
  const e = formState.errors;
  const education = useFieldArray({ control, name: "education" });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <FormRow id="gender" label="Gender" optional hint="Some people prefer to choose a provider by gender.">
            <Select value={field.value || undefined} onValueChange={(v) => v && field.onChange(v)}>
              <SelectTrigger id="gender" className="w-full" aria-describedby="gender-hint">
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        )}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <FormRow id="feeIndividual" label="Individual session" optional hint="USD per session" error={e.feeIndividual?.message}>
          <Input
            id="feeIndividual"
            inputMode="numeric"
            placeholder="e.g. 120"
            aria-invalid={!!e.feeIndividual}
            aria-describedby={describedBy("feeIndividual", { hint: true, error: e.feeIndividual })}
            {...register("feeIndividual")}
          />
        </FormRow>
        <FormRow id="feeCouples" label="Couples session" optional hint="USD per session" error={e.feeCouples?.message}>
          <Input
            id="feeCouples"
            inputMode="numeric"
            placeholder="e.g. 160"
            aria-invalid={!!e.feeCouples}
            aria-describedby={describedBy("feeCouples", { hint: true, error: e.feeCouples })}
            {...register("feeCouples")}
          />
        </FormRow>
      </div>

      <Controller
        control={control}
        name="slidingScale"
        render={({ field }) => (
          <label className="flex items-center gap-3 type-small text-text-primary">
            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
            I offer a sliding scale for people with limited income
          </label>
        )}
      />
      <Controller
        control={control}
        name="acceptingNewClients"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-4 rounded-field border border-warm-200 bg-warm-25 p-4">
            <span className="flex flex-col gap-0.5">
              <span className="type-small font-medium text-text-primary">Accepting new clients</span>
              <span className="type-small text-text-tertiary">Turn this off to pause new session requests.</span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Accepting new clients" />
          </label>
        )}
      />

      <fieldset className="flex flex-col gap-4" data-field="education">
        <legend className="mb-1 flex w-full items-baseline justify-between text-sm font-medium text-text-primary">
          Education
          <span className="type-small font-normal text-text-placeholder">Optional</span>
        </legend>
        {education.fields.map((f, i) => (
          <div key={f.id} className="flex flex-col gap-3 rounded-field border border-warm-200 p-4">
            <FormRow id={`education.${i}.degree`} label="Degree" required error={errorAt(e, `education.${i}.degree`)}>
              <Input id={`education.${i}.degree`} placeholder="e.g. Ph.D. Clinical Psychology" {...register(`education.${i}.degree`)} />
            </FormRow>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <FormRow id={`education.${i}.school`} label="School" required error={errorAt(e, `education.${i}.school`)}>
                <Input id={`education.${i}.school`} placeholder="e.g. Columbia University" {...register(`education.${i}.school`)} />
              </FormRow>
              <FormRow id={`education.${i}.year`} label="Year" optional error={errorAt(e, `education.${i}.year`)}>
                <Input id={`education.${i}.year`} inputMode="numeric" placeholder="2015" {...register(`education.${i}.year`)} />
              </FormRow>
            </div>
            <Button type="button" variant="ghost" size="sm" className="self-end" onClick={() => education.remove(i)}>
              <Trash2Icon />
              Remove
            </Button>
          </div>
        ))}
        {education.fields.length < 4 && (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => education.append({ degree: "", school: "", year: "" })}
          >
            <PlusIcon />
            Add education
          </Button>
        )}
      </fieldset>

      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
