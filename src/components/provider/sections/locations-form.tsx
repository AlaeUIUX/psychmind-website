"use client";

import { cn } from "cn";
import { ChevronDownIcon, InfoIcon, PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { ChoiceChips } from "@/components/app/choice-chips";
import { FormRow } from "@/components/forms/form-row";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BASE_PLAN } from "@/lib/billing";
import { locationLimit, locationsSchema, type LocationsInput } from "@/lib/provider/schema";
import { SESSION_FORMATS, US_STATES, stateName } from "@/lib/taxonomy";
import { formatsLabel } from "../profile-view";
import { SectionFooter, type SectionProps, errorAt, useSectionForm } from "./shared";

type Location = LocationsInput["locations"][number];
const blank = (primary: boolean): Location => ({
  state: "" as Location["state"],
  city: "",
  zip: "",
  practiceName: "",
  address: "",
  formats: ["online"],
  isPrimary: primary,
});

/** Figma P5 right panel. */
export function LicenseComplianceCard() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-950">
      <p className="flex items-center gap-2 type-small font-semibold">
        <InfoIcon aria-hidden className="size-4" />
        License compliance
      </p>
      <p className="type-small">You may only list states where you hold a valid, active license.</p>
      <p className="type-small">Adding a state without a license violates professional regulations and Psychmind&apos;s terms.</p>
      <p className="type-small">We verify this against your submitted credentials.</p>
    </div>
  );
}

/** Figma P5c "Upgrade your plan". Buying extra locations needs Stripe (billing page). */
function UpgradeDialog({ billingHref }: { billingHref: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="inverse" size="sm">
          Upgrade for more
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade your plan</DialogTitle>
          <DialogDescription>Flexible pricing that grows with you.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3">
          <li className="rounded-field border border-warm-800 p-4">
            <p className="type-small font-semibold text-text-primary">Basic plan</p>
            <p className="type-small text-text-tertiary">3 locations free</p>
          </li>
          <li className="rounded-field border border-warm-200 p-4">
            <p className="type-small font-semibold text-text-primary">Upgrade plan</p>
            <p className="type-small text-text-tertiary">{BASE_PLAN.extraLocationLabel}</p>
          </li>
        </ul>
        {/* TODO(client): extra locations are bought once the listing is active. */}
        <p className="type-small text-text-tertiary">
          You can add extra locations from Billing once your profile is verified and your listing is active.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Go back</Button>
          </DialogClose>
          <Button asChild variant="inverse" className="bg-warm-950 text-white hover:bg-warm-800">
            <a href={billingHref}>Go to billing</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Figma P5 "Practice locations": one card per licensed state, collapsible,
// with the base-plan usage meter and the 3-location limit (P5b/P5c).
export function LocationsForm({ state, mode, onPreview, backHref, nextHref }: SectionProps) {
  const limit = locationLimit(state.extraLocations);
  const toPreview = useCallback(
    (v: LocationsInput) => ({
      locations: (v.locations ?? [])
        .filter((l) => l?.state && l.city)
        .map((l) => ({ state: l.state, city: l.city, zip: l.zip, formats: l.formats ?? [], isPrimary: !!l.isPrimary })),
    }),
    [],
  );
  const { form, onSubmit, pending } = useSectionForm({
    section: "locations",
    schema: locationsSchema,
    mode,
    nextHref,
    onPreview,
    toPreview,
    defaultValues: {
      locations: state.locations.length
        ? state.locations.map((l) => ({ ...l, state: l.state as Location["state"], formats: l.formats as Location["formats"] }))
        : [blank(true)],
    },
  });
  const { control, register, formState, watch, setValue } = form;
  const e = formState.errors;
  const { fields, append, remove } = useFieldArray({ control, name: "locations" });
  const [open, setOpen] = useState<number | null>(state.locations.length ? null : 0);
  const values = watch("locations") ?? [];
  const atLimit = fields.length >= limit;

  const makePrimary = (index: number) =>
    values.forEach((_, i) => setValue(`locations.${i}.isPrimary`, i === index, { shouldDirty: true }));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <LicenseComplianceCard />

      {atLimit && (
        <div className="flex flex-col gap-3 rounded-card bg-warm-800 p-5 text-white">
          <p className="flex items-center gap-2 type-small font-semibold">
            <SparklesIcon aria-hidden className="size-4" />
            You&apos;ve reached your {limit}-location limit
          </p>
          <p className="type-small text-warm-300">
            Your base plan includes 3 licensed states. Upgrade to add more locations and expand your patient reach.
          </p>
          <div>
            <UpgradeDialog billingHref="/provider/billing" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-field border border-warm-200 bg-warm-25 p-4">
        <div className="flex items-baseline justify-between">
          <p className="type-small font-semibold text-text-primary">Base plan</p>
          <p className="type-small text-text-tertiary">
            {fields.length} of {limit} locations used
          </p>
        </div>
        <div aria-hidden className="flex gap-1">
          {Array.from({ length: limit }, (_, i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-pill", i < fields.length ? "bg-brand-primary" : "bg-warm-200")} />
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {fields.map((f, i) => {
          const v = values[i] ?? f;
          const expanded = open === i;
          const title = v.state && v.city ? `${v.city}, ${v.state}` : v.state ? stateName(v.state) : "Add a new location";
          const sub = v.state && v.city
            ? [formatsLabel(v.formats ?? []), v.isPrimary ? "Primary location" : null].filter(Boolean).join(" · ")
            : "Fill the form with the details";
          const hasError = !!errorAt(e, `locations.${i}`);
          return (
            <li key={f.id} className={cn("rounded-field border bg-white", hasError ? "border-red-300" : "border-warm-200")}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : i)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="type-small font-semibold text-text-primary">{title}</span>
                  <span className="type-small text-text-tertiary">{sub}</span>
                </span>
                <ChevronDownIcon aria-hidden className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")} />
              </button>
              <div hidden={!expanded} className="flex flex-col gap-5 border-t border-warm-200 p-4">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name={`locations.${i}.state`}
                    render={({ field }) => (
                      <FormRow id={`loc-${i}-state`} label="State" required error={errorAt(e, `locations.${i}.state`)}>
                        <Select value={field.value || undefined} onValueChange={(v) => v && field.onChange(v)}>
                          <SelectTrigger id={`loc-${i}-state`} className="w-full" aria-invalid={!!errorAt(e, `locations.${i}.state`)}>
                            <SelectValue placeholder="New York" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormRow>
                    )}
                  />
                  <FormRow id={`loc-${i}-city`} label="City" required error={errorAt(e, `locations.${i}.city`)}>
                    <Input id={`loc-${i}-city`} placeholder="New York" {...register(`locations.${i}.city`)} />
                  </FormRow>
                </div>
                <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
                  <FormRow id={`loc-${i}-practice`} label="Practice name" optional>
                    <Input id={`loc-${i}-practice`} placeholder="e.g: Manhattan Mind Clinic" {...register(`locations.${i}.practiceName`)} />
                  </FormRow>
                  {/* ZIP isn't in Figma but the profile shows it and search needs it. TODO(client) */}
                  <FormRow id={`loc-${i}-zip`} label="ZIP code" optional error={errorAt(e, `locations.${i}.zip`)}>
                    <Input id={`loc-${i}-zip`} inputMode="numeric" maxLength={5} placeholder="10001" {...register(`locations.${i}.zip`)} />
                  </FormRow>
                </div>
                <FormRow
                  id={`loc-${i}-address`}
                  label="Address"
                  optional
                  hint="Only shown publicly if you offer in-person sessions at this location."
                >
                  <Input id={`loc-${i}-address`} placeholder="Address here" {...register(`locations.${i}.address`)} />
                </FormRow>
                <Controller
                  control={control}
                  name={`locations.${i}.formats`}
                  render={({ field }) => (
                    <fieldset className="flex flex-col gap-2">
                      <legend className="mb-1 text-sm font-medium text-text-primary">
                        Session format at this location <span aria-hidden className="text-destructive">*</span>
                      </legend>
                      <ChoiceChips label="Session format" options={[...SESSION_FORMATS]} value={field.value ?? []} onValueChange={field.onChange} />
                      {errorAt(e, `locations.${i}.formats`) && (
                        <p role="alert" className="type-small text-destructive">{errorAt(e, `locations.${i}.formats`)}</p>
                      )}
                    </fieldset>
                  )}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 type-small text-text-primary">
                    <Checkbox checked={!!v.isPrimary} onCheckedChange={(c) => c === true && makePrimary(i)} />
                    Primary location
                  </label>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const wasPrimary = v.isPrimary;
                        remove(i);
                        setOpen(null);
                        if (wasPrimary) setTimeout(() => setValue("locations.0.isPrimary", true, { shouldDirty: true }));
                      }}
                    >
                      <Trash2Icon />
                      Remove location
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {(e.locations?.message || e.locations?.root?.message) && (
        <p role="alert" className="type-small text-destructive">
          {e.locations?.message ?? e.locations?.root?.message}
        </p>
      )}

      {!atLimit && (
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => {
            append(blank(fields.length === 0));
            setOpen(fields.length);
          }}
        >
          <PlusIcon />
          Add another location
        </Button>
      )}

      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
