"use client";

import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { useCallback } from "react";
import { Controller } from "react-hook-form";
import { FormRow, describedBy } from "@/components/forms/form-row";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { identitySchema, type IdentityInput } from "@/lib/provider/schema";
import { BANNER_STYLES } from "@/lib/taxonomy";
import { ProfileBanner } from "../profile-view";
import { SectionFooter, type SectionProps, useSectionForm } from "./shared";

// Figma P1 "Your identity". Business name (+ "Enlist with business name") comes
// from the provider sign-up screen (A2) and is editable here too.
export function IdentityForm({ state, mode, onPreview, backHref, nextHref }: SectionProps) {
  const toPreview = useCallback(
    (v: IdentityInput) => ({
      firstName: v.firstName,
      lastName: v.lastName,
      titleCredentials: v.titleCredentials,
      pronouns: v.pronouns,
      bannerStyle: v.bannerStyle,
      businessName: v.businessName,
      displayAsBusiness: v.displayAsBusiness,
    }),
    [],
  );
  const { form, onSubmit, pending } = useSectionForm({
    section: "identity",
    schema: identitySchema,
    mode,
    nextHref,
    onPreview,
    toPreview,
    defaultValues: {
      firstName: state.firstName,
      lastName: state.lastName,
      titleCredentials: state.titleCredentials,
      pronouns: state.pronouns,
      bannerStyle: state.bannerStyle,
      businessName: state.businessName,
      displayAsBusiness: state.displayAsBusiness,
    },
  });
  const { register, control, formState } = form;
  const e = formState.errors;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormRow id="firstName" label="First name" required error={e.firstName?.message}>
          <Input
            id="firstName"
            placeholder="John"
            autoComplete="given-name"
            aria-invalid={!!e.firstName}
            aria-describedby={describedBy("firstName", { error: e.firstName })}
            {...register("firstName")}
          />
        </FormRow>
        <FormRow id="lastName" label="Last name" required error={e.lastName?.message}>
          <Input
            id="lastName"
            placeholder="Doe"
            autoComplete="family-name"
            aria-invalid={!!e.lastName}
            aria-describedby={describedBy("lastName", { error: e.lastName })}
            {...register("lastName")}
          />
        </FormRow>
      </div>

      <FormRow
        id="titleCredentials"
        label="Title / credentials"
        required
        hint="Appears below your name on your profile."
        error={e.titleCredentials?.message}
      >
        <Input
          id="titleCredentials"
          placeholder="e.g: Clinical Psychologist, Ph.D."
          aria-invalid={!!e.titleCredentials}
          aria-describedby={describedBy("titleCredentials", { hint: true, error: e.titleCredentials })}
          {...register("titleCredentials")}
        />
      </FormRow>

      <FormRow id="pronouns" label="Pronouns" optional error={e.pronouns?.message}>
        <Input id="pronouns" placeholder="e.g: They/Them" {...register("pronouns")} />
      </FormRow>

      <FormRow id="businessName" label="Business name" optional error={e.businessName?.message}>
        <Input id="businessName" placeholder="e.g. ThinkWell Therapy Center" {...register("businessName")} />
      </FormRow>
      <Controller
        control={control}
        name="displayAsBusiness"
        render={({ field }) => (
          <label className="flex cursor-pointer gap-3 rounded-field border border-warm-200 bg-warm-25 p-4 has-data-[state=checked]:border-warm-800">
            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="type-small font-medium text-text-primary">Enlist with business name</span>
              <span className="type-small text-text-tertiary">
                Your full name will not show, and your profile will feature the business name
              </span>
            </span>
          </label>
        )}
      />

      <Controller
        control={control}
        name="bannerStyle"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-3">
            <legend className="flex w-full items-baseline justify-between text-sm font-medium text-text-primary">
              Banner style
              <span className="type-small font-normal text-text-placeholder">Optional</span>
            </legend>
            <div role="radiogroup" aria-label="Banner style" className="grid grid-cols-4 gap-2">
              {BANNER_STYLES.map((b) => {
                const on = field.value === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={b.label}
                    onClick={() => field.onChange(b.value)}
                    className={cn(
                      "relative h-11 overflow-hidden rounded-md ring-offset-2 transition-shadow focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none",
                      on ? "ring-2 ring-warm-800" : "ring-1 ring-black/10 hover:ring-warm-400",
                    )}
                  >
                    <ProfileBanner style={b.value} className="absolute inset-0" />
                    {on && (
                      <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-white text-warm-900">
                        <CheckIcon className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      />

      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
