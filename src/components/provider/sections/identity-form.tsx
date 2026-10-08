"use client";

import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { useCallback } from "react";
import { Controller } from "react-hook-form";
import { FormRow, describedBy } from "@/components/forms/form-row";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { identitySchema, type IdentityInput } from "@/lib/provider/schema";
import { BANNER_STYLES } from "@/lib/taxonomy";
import { ProfileBanner } from "../profile-view";
import { SectionFooter, type SectionProps, useSectionForm } from "./shared";

const PRONOUNS = ["She/her", "He/him", "They/them"];

// Figma P1 "Your identity". Business name (+ "Enlist with business name") comes
// from the provider sign-up screen (A2) and is editable here too; turning it
// on swaps the name on the live preview.
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
  const { register, control, formState, watch, setValue } = form;
  const e = formState.errors;
  const pronouns = watch("pronouns");

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
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

      <FormRow id="titleCredentials" label="Title / credentials" required hint="Appears below your name on your profile." error={e.titleCredentials?.message}>
        <Input
          id="titleCredentials"
          placeholder="e.g: Clinical Psychologist, Ph.D."
          aria-invalid={!!e.titleCredentials}
          aria-describedby={describedBy("titleCredentials", { hint: true, error: e.titleCredentials })}
          {...register("titleCredentials")}
        />
      </FormRow>

      <FormRow id="pronouns" label="Pronouns" optional error={e.pronouns?.message}>
        <div className="flex flex-col gap-2">
          <Input id="pronouns" placeholder="e.g: They/Them" {...register("pronouns")} />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick picks">
            {PRONOUNS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue("pronouns", pronouns === p ? "" : p, { shouldDirty: true })}
                className={cn(
                  "h-7 rounded-md px-2.5 type-ui-caption font-medium transition-colors",
                  pronouns === p ? "bg-warm-900 text-white" : "bg-warm-100 text-warm-700 hover:bg-warm-200",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </FormRow>

      <div className="flex flex-col gap-3 rounded-xl border border-warm-200 p-4" data-field="businessName">
        <FormRow id="businessName" label="Business name" optional error={e.businessName?.message}>
          <Input id="businessName" placeholder="e.g. ThinkWell Therapy Center" {...register("businessName")} />
        </FormRow>
        <Controller
          control={control}
          name="displayAsBusiness"
          render={({ field }) => (
            <label className="flex items-start justify-between gap-4">
              <span className="flex flex-col gap-0.5">
                <span className="type-ui-label text-warm-800">Enlist with business name</span>
                <span className="type-ui-caption text-warm-500">Your full name will not show, and your profile will feature the business name</span>
              </span>
              <Switch id="displayAsBusiness" checked={field.value} onCheckedChange={field.onChange} aria-label="Enlist with business name" />
            </label>
          )}
        />
      </div>

      <Controller
        control={control}
        name="bannerStyle"
        render={({ field }) => (
          <div className="flex flex-col gap-2.5" data-field="bannerStyle">
            <div className="flex items-baseline justify-between">
              <p id="banner-label" className="type-ui-label text-warm-800">
                Banner style
              </p>
              <span className="type-ui-caption text-warm-400">Optional</span>
            </div>
            <div role="radiogroup" aria-labelledby="banner-label" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {BANNER_STYLES.map((b) => {
                const on = field.value === b.value;
                return (
                  <Tooltip key={b.value}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        role="radio"
                        id={`banner-${b.value}`}
                        aria-checked={on}
                        aria-label={b.label}
                        onClick={() => field.onChange(b.value)}
                        className={cn(
                          "relative h-10 overflow-hidden rounded-md transition-shadow outline-none focus-visible:ring-4 focus-visible:ring-ring/20",
                          on ? "ring-2 ring-warm-900 ring-offset-2" : "ring-1 ring-black/10 hover:ring-warm-400",
                        )}
                      >
                        <ProfileBanner style={b.value} className="absolute inset-0" />
                        {on && (
                          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-white text-warm-900 shadow-sm">
                            <CheckIcon className="size-3" />
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{b.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      />

      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
