"use client";

import { CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller } from "react-hook-form";
import { ChoiceChips } from "@/components/app/choice-chips";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expertiseSchema, type ExpertiseInput } from "@/lib/provider/schema";
import { APPROACHES, LANGUAGES, SPECIALTIES, labelOf, type Option } from "@/lib/taxonomy";
import { ChipField } from "./clients-form";
import { SectionFooter, type SectionProps, useSectionForm } from "./shared";

/** Preset chips plus any custom values the provider added ("Add specialty"). */
function withCustom(options: readonly Option[], value: string[]): Option[] {
  const known = new Set(options.map((o) => o.value));
  return [...options, ...value.filter((v) => !known.has(v)).map((v) => ({ value: v, label: v }))];
}

function AddCustom({ placeholder, button, onAdd }: { placeholder: string; button: string; onAdd: (v: string) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (v) onAdd(v);
    setText("");
  };
  return (
    <div className="flex gap-2">
      <Input
        value={text}
        maxLength={40}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
      />
      <Button type="button" variant="secondary" onClick={add} className="shrink-0">
        <PlusIcon />
        {button}
      </Button>
    </div>
  );
}

function LanguagePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="secondary" className="w-full justify-between font-normal text-text-placeholder">
            Choose a language
            <PlusIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command>
            <CommandInput placeholder="Search languages…" />
            <CommandList>
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup>
                {LANGUAGES.map((l) => {
                  const on = value.includes(l.value);
                  return (
                    <CommandItem
                      key={l.value}
                      value={l.value}
                      onSelect={() => {
                        onChange(on ? value.filter((v) => v !== l.value) : [...value, l.value]);
                        setOpen(false);
                      }}
                    >
                      <CheckIcon className={on ? "opacity-100" : "opacity-0"} />
                      {l.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Languages you hold sessions in">
          {value.map((lang) => (
            <li key={lang} className="flex h-9 items-center gap-1 rounded-pill border border-warm-800 bg-warm-800 pr-1 pl-3.5 text-sm font-medium text-white">
              {lang}
              <button
                type="button"
                aria-label={`Remove ${lang}`}
                onClick={() => onChange(value.filter((v) => v !== lang))}
                className="flex size-7 items-center justify-center rounded-full hover:bg-white/15"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Figma P4b "Your expertise": specialties, approaches, languages. "Main
// specialty" is new (business rule: a preferred specialty) — TODO(client).
export function ExpertiseForm({ state, mode, onPreview, backHref, nextHref }: SectionProps) {
  const toPreview = useCallback(
    (v: ExpertiseInput) => ({
      specialties: v.specialties ?? [],
      primarySpecialty: v.primarySpecialty,
      approaches: v.approaches ?? [],
      languages: v.languages ?? [],
    }),
    [],
  );
  const { form, onSubmit, pending } = useSectionForm({
    section: "expertise",
    schema: expertiseSchema,
    mode,
    nextHref,
    onPreview,
    toPreview,
    defaultValues: {
      specialties: state.specialties,
      primarySpecialty: state.primarySpecialty,
      approaches: state.approaches,
      languages: state.languages.length ? state.languages : ["English"],
    },
  });
  const { control, formState, watch, setValue } = form;
  const e = formState.errors;
  const specialties = watch("specialties") ?? [];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <Controller
        control={control}
        name="specialties"
        render={({ field }) => (
          <ChipField label="Specialties" hint="Choose all that apply" error={e.specialties?.message}>
            <AddCustom
              placeholder="Add more"
              button="Add specialty"
              onAdd={(v) => !field.value?.includes(v) && field.onChange([...(field.value ?? []), v])}
            />
            <ChoiceChips
              label="Specialties"
              options={withCustom(SPECIALTIES, field.value ?? [])}
              value={field.value ?? []}
              onValueChange={(v) => {
                field.onChange(v);
                if (!v.includes(form.getValues("primarySpecialty"))) setValue("primarySpecialty", v[0] ?? "");
              }}
              max={15}
            />
          </ChipField>
        )}
      />

      <Controller
        control={control}
        name="primarySpecialty"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-text-primary">
              Main specialty <span aria-hidden className="text-destructive">*</span>
            </legend>
            {/* Radix Select can emit "" while its options change — ignore it so the
                auto-picked main specialty isn't wiped. */}
            <Select value={field.value || undefined} onValueChange={(v) => v && field.onChange(v)} disabled={!specialties.length}>
              <SelectTrigger className="w-full" aria-label="Main specialty" aria-invalid={!!e.primarySpecialty}>
                <SelectValue placeholder={specialties.length ? "Choose one of your specialties" : "Pick specialties first"} />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((s) => (
                  <SelectItem key={s} value={s}>
                    {labelOf("specialties", s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="type-small text-text-tertiary">Shown first on your profile and used to match you in search.</p>
            {e.primarySpecialty && (
              <p role="alert" className="type-small text-destructive">
                {e.primarySpecialty.message}
              </p>
            )}
          </fieldset>
        )}
      />

      <Controller
        control={control}
        name="approaches"
        render={({ field }) => (
          <ChipField label="Therapy approaches" hint="Choose all that apply" error={e.approaches?.message}>
            <AddCustom
              placeholder="Add more"
              button="Add approach"
              onAdd={(v) => !field.value?.includes(v) && field.onChange([...(field.value ?? []), v])}
            />
            <ChoiceChips
              label="Therapy approaches"
              options={withCustom(APPROACHES, field.value ?? [])}
              value={field.value ?? []}
              onValueChange={field.onChange}
              max={10}
            />
          </ChipField>
        )}
      />

      <Controller
        control={control}
        name="languages"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-text-primary">
              Languages <span aria-hidden className="text-destructive">*</span>
            </legend>
            <LanguagePicker value={field.value ?? []} onChange={field.onChange} />
            {e.languages && (
              <p role="alert" className="type-small text-destructive">
                {e.languages.message}
              </p>
            )}
          </fieldset>
        )}
      />

      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
