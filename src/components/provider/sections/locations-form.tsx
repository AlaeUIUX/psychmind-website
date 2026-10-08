"use client";

import { cn } from "cn";
import { BuildingIcon, CheckIcon, MonitorIcon, PencilIcon, PlusIcon, ShieldCheckIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { useCallback, useState, type ComponentType } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { FormRow } from "@/components/forms/form-row";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { BASE_PLAN } from "@/lib/billing";
import { locationLimit, locationsSchema, type LocationsInput } from "@/lib/provider/schema";
import { SESSION_FORMATS, US_STATES, stateName } from "@/lib/taxonomy";
import { formatsLabel } from "../profile-view";
import { SectionFooter, type SectionProps, errorAt, useSectionForm } from "./shared";

type Location = LocationsInput["locations"][number];
type Format = Location["formats"][number];

const blank = (primary: boolean): Location => ({
  state: "" as Location["state"],
  city: "",
  zip: "",
  practiceName: "",
  address: "",
  formats: ["online"],
  isPrimary: primary,
});

const FORMAT_ICONS: Record<Format, ComponentType<{ className?: string }>> = { online: MonitorIcon, in_person: BuildingIcon };

/** Figma P5 right panel (copy unchanged). */
function LicenseComplianceCard() {
  return (
    <div className="flex gap-3 rounded-xl bg-warm-50 p-4 ring-1 ring-warm-200 ring-inset">
      <ShieldCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-blue-600" />
      <div className="flex flex-col gap-1 type-ui-small text-warm-600">
        <p className="font-semibold text-warm-900">License compliance</p>
        <p>You may only list states where you hold a valid, active license.</p>
        <p>Adding a state without a license violates professional regulations and Psychmind&apos;s terms.</p>
        <p>We verify this against your submitted credentials.</p>
      </div>
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

/** The state's two-letter code on a tile, like a map marker. */
function StateTile({ code, active }: { code?: string; active?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg font-mono text-[13px] font-semibold tracking-wide transition-colors",
        active ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 ring-inset" : "bg-warm-100 text-warm-700",
      )}
    >
      {code || <PlusIcon className="size-4" />}
    </span>
  );
}

/** Session formats as choice cards (multi-select), like the sign-up role cards. */
function FormatCards({ id, value, onChange, invalid }: { id: string; value: Format[]; onChange: (v: Format[]) => void; invalid?: boolean }) {
  return (
    <div id={id} role="group" aria-label="Session format" className="grid gap-2.5 sm:grid-cols-2">
      {SESSION_FORMATS.map((f) => {
        const on = value.includes(f.value);
        const Icon = FORMAT_ICONS[f.value];
        return (
          <button
            key={f.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            aria-invalid={invalid || undefined}
            onClick={() => onChange(on ? value.filter((v) => v !== f.value) : [...value, f.value])}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-white p-3 text-left outline-none transition-[border-color,box-shadow,background-color] duration-200",
              "focus-visible:ring-4 focus-visible:ring-ring/15",
              on
                ? "border-blue-600 bg-blue-50/50 shadow-[0_0_0_1px_var(--color-blue-600)]"
                : cn("hover:border-warm-300 hover:bg-warm-50/60", invalid ? "border-red-300" : "border-warm-200"),
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-warm-50 text-warm-700">
              <Icon className="size-4" />
            </span>
            <span className="flex-1 type-ui-heading text-warm-900">{f.label}</span>
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                on ? "border-blue-600 bg-blue-600 text-white" : "border-warm-300 bg-white",
              )}
            >
              {on && <CheckIcon className="size-3" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Figma P5 "Practice locations": a list of licensed states. Each location is a
// compact card; one at a time opens to edit. The address only matters (and
// only shows publicly) for in-person sessions, so it appears once In-person is
// picked. Base-plan usage and the 3-location limit as in P5b/P5c.
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
  // After a failed save, the first location with a problem opens itself.
  const firstError = fields.findIndex((_, i) => !!errorAt(e, `locations.${i}`));
  const expandedIndex = open ?? (firstError >= 0 ? firstError : null);

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

      <div className="flex items-center justify-between gap-4">
        <p className="type-ui-label text-warm-800">Base plan</p>
        <div className="flex items-center gap-3">
          <span className="type-ui-caption text-warm-500">
            {fields.length} of {limit} locations used
          </span>
          <span aria-hidden className="flex gap-1">
            {Array.from({ length: limit }, (_, i) => (
              <span key={i} className={cn("h-1.5 w-5 rounded-full transition-colors duration-300", i < fields.length ? "bg-blue-600" : "bg-warm-200")} />
            ))}
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {fields.map((f, i) => {
          const v = values[i] ?? f;
          const expanded = expandedIndex === i;
          const hasError = !!errorAt(e, `locations.${i}`);
          const formats = (v.formats ?? []) as Format[];
          const inPerson = formats.includes("in_person");
          const title = v.state && v.city ? `${v.city}, ${stateName(v.state)}` : v.state ? stateName(v.state) : "New location";
          const details = [v.practiceName, formatsLabel(formats)].filter(Boolean).join(" · ");
          return (
            <li
              key={f.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] duration-200",
                hasError ? "border-red-300" : expanded ? "border-warm-300 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)]" : "border-warm-200",
              )}
            >
              {/* Summary row: always visible. */}
              <div className="flex items-center gap-3 p-3.5">
                <StateTile code={v.state} active={expanded} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="flex items-center gap-2 type-ui-heading text-warm-900">
                    <span className="truncate">{title}</span>
                    {/* TODO(client): copy */}
                    {v.isPrimary && <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">Primary</span>}
                  </p>
                  <p className={cn("truncate type-ui-caption", hasError ? "text-red-700" : "text-warm-500")}>
                    {/* TODO(client): copy */}
                    {hasError ? "Some details are missing" : details || "Fill the form with the details"}
                  </p>
                </div>
                {!expanded && (
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2.5 text-[13px]" onClick={() => setOpen(i)} aria-label={`Edit ${title}`}>
                    <PencilIcon />
                    Edit
                  </Button>
                )}
              </div>

              <div hidden={!expanded} className="flex animate-ui-enter flex-col gap-5 border-t border-warm-200 p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name={`locations.${i}.state`}
                    render={({ field }) => (
                      <FormRow id={`loc-${i}-state`} label="State" required error={errorAt(e, `locations.${i}.state`)}>
                        <Select value={field.value || undefined} onValueChange={(val) => val && field.onChange(val)}>
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
                <div className="grid gap-4 sm:grid-cols-[1fr_128px]">
                  <FormRow id={`loc-${i}-practice`} label="Practice name" optional>
                    <Input id={`loc-${i}-practice`} placeholder="e.g: Manhattan Mind Clinic" {...register(`locations.${i}.practiceName`)} />
                  </FormRow>
                  {/* ZIP isn't in Figma but the profile shows it and search needs it. TODO(client) */}
                  <FormRow id={`loc-${i}-zip`} label="ZIP code" optional error={errorAt(e, `locations.${i}.zip`)}>
                    <Input id={`loc-${i}-zip`} inputMode="numeric" maxLength={5} placeholder="10001" {...register(`locations.${i}.zip`)} />
                  </FormRow>
                </div>

                <Controller
                  control={control}
                  name={`locations.${i}.formats`}
                  render={({ field }) => (
                    <fieldset className="flex flex-col gap-2" data-field={`loc-${i}-formats`}>
                      <legend className="mb-1.5 text-[13px] font-medium text-text-primary">
                        Session format at this location <span aria-hidden className="text-destructive">*</span>
                      </legend>
                      <FormatCards
                        id={`loc-${i}-formats`}
                        value={(field.value ?? []) as Format[]}
                        onChange={field.onChange}
                        invalid={!!errorAt(e, `locations.${i}.formats`)}
                      />
                      {errorAt(e, `locations.${i}.formats`) && (
                        <p role="alert" className="type-small text-destructive">{errorAt(e, `locations.${i}.formats`)}</p>
                      )}
                    </fieldset>
                  )}
                />

                {inPerson && (
                  <div className="animate-ui-enter">
                    <FormRow
                      id={`loc-${i}-address`}
                      label="Address"
                      optional
                      hint="Only shown publicly if you offer in-person sessions at this location."
                    >
                      <Input id={`loc-${i}-address`} placeholder="Address here" {...register(`locations.${i}.address`)} />
                    </FormRow>
                  </div>
                )}

                <div className="-mx-4 -mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-warm-200 bg-warm-50/60 px-4 py-3 sm:-mx-5 sm:-mb-5 sm:px-5">
                  <label className="flex items-center gap-2.5 type-ui-small text-warm-800">
                    <Switch
                      checked={!!v.isPrimary}
                      disabled={!!v.isPrimary}
                      onCheckedChange={(c) => c && makePrimary(i)}
                      aria-label="Primary location"
                      className="data-[state=checked]:bg-blue-600 disabled:cursor-default disabled:opacity-100"
                    />
                    Primary location
                  </label>
                  <div className="flex items-center gap-1">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-[13px] text-red-700 hover:text-red-800"
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
                    {/* TODO(client): copy */}
                    <Button type="button" variant="secondary" size="sm" className="h-8 px-3 text-[13px] shadow-none" onClick={() => setOpen(null)}>
                      Done
                    </Button>
                  </div>
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
        <button
          type="button"
          onClick={() => {
            append(blank(fields.length === 0));
            setOpen(fields.length);
          }}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-warm-300 type-ui-small font-medium text-warm-700 transition-colors hover:border-warm-400 hover:bg-warm-50 hover:text-warm-900 focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:outline-none"
        >
          <PlusIcon className="size-4" />
          Add another location
        </button>
      )}

      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
