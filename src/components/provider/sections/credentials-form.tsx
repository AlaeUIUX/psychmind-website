"use client";

import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UploadDropzone, type UploadItem } from "@/components/app/upload-dropzone";
import { FormRow, describedBy } from "@/components/forms/form-row";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { credentialsSchema, type CredentialsInput } from "@/lib/provider/schema";
import type { UploadMeta } from "@/lib/provider/state";
import { UPLOAD_RULES } from "@/lib/provider/uploads";
import { stateName } from "@/lib/taxonomy";
import { uploadFile } from "../upload-client";
import { SectionFooter, type SectionProps, errorAt, useSectionForm } from "./shared";

type License = CredentialsInput["licenses"][number];

const licenseBadge = {
  pending: { variant: "info", label: "In review" },
  verified: { variant: "success", label: "Verified" },
  rejected: { variant: "danger", label: "Not verified" },
} as const;

// Figma P6 "Credentials & verification": one card per state from Locations.
// NPI and years of experience are per person, so they're asked once above
// the cards (Figma repeats them per state — flagged).
export function CredentialsForm({ state, mode, backHref, nextHref }: SectionProps) {
  const docs = new Map(state.licenses.filter((l) => l.document).map((l) => [l.state, l.document!]));
  const [documents, setDocuments] = useState<Map<string, UploadMeta>>(docs);
  const [uploads, setUploads] = useState<Record<string, UploadItem | undefined>>({});
  const [open, setOpen] = useState<string | null>(state.locations[0]?.state ?? null);

  const existing = new Map(state.licenses.map((l) => [l.state, l]));
  const { form, onSubmit, pending } = useSectionForm({
    section: "credentials",
    schema: credentialsSchema,
    mode,
    nextHref,
    defaultValues: {
      npiNumber: state.npiNumber,
      yearsExperience: state.yearsExperience ?? "",
      licenses: state.locations.map((loc) => {
        const l = existing.get(loc.state);
        return {
          state: loc.state as License["state"],
          licenseNumber: l?.licenseNumber ?? "",
          issuingBody: l?.issuingBody ?? "",
          documentId: l?.document?.id ?? "",
        };
      }),
    },
  });
  const { register, formState, setValue } = form;
  const e = formState.errors;

  if (!state.locations.length) {
    return (
      <div className="flex flex-col gap-4 rounded-field border border-amber-200 bg-amber-50 p-5 type-small text-amber-950">
        Add your practice locations first — you&apos;ll upload a license for each state.
        <Link href="/provider/onboarding/locations" className="font-semibold underline underline-offset-2">
          Go to practice locations
        </Link>
      </div>
    );
  }

  const upload = async (index: number, stateCode: string, file: File) => {
    setUploads((u) => ({ ...u, [stateCode]: { id: stateCode, name: file.name, size: file.size, status: "uploading", progress: 0 } }));
    try {
      const meta = await uploadFile(file, "license", (progress) =>
        setUploads((u) => ({ ...u, [stateCode]: u[stateCode] && { ...u[stateCode]!, progress } })),
      );
      setDocuments((d) => new Map(d).set(stateCode, meta));
      setUploads((u) => ({ ...u, [stateCode]: undefined }));
      setValue(`licenses.${index}.documentId`, meta.id, { shouldDirty: true, shouldValidate: true });
    } catch (err) {
      setUploads((u) => ({ ...u, [stateCode]: u[stateCode] && { ...u[stateCode]!, status: "error", error: (err as Error).message } }));
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormRow id="npiNumber" label="NPI number" required hint="Your 10-digit National Provider Identifier." error={e.npiNumber?.message}>
          <Input
            id="npiNumber"
            inputMode="numeric"
            maxLength={10}
            placeholder="1234567890"
            aria-invalid={!!e.npiNumber}
            aria-describedby={describedBy("npiNumber", { hint: true, error: e.npiNumber })}
            {...register("npiNumber")}
          />
        </FormRow>
        <FormRow id="yearsExperience" label="Years of experience" optional error={e.yearsExperience?.message}>
          <Input id="yearsExperience" inputMode="numeric" placeholder="e.g. 9" {...register("yearsExperience")} />
        </FormRow>
      </div>

      <ul className="flex flex-col gap-3">
        {state.locations.map((loc, i) => {
          const expanded = open === loc.state;
          const doc = documents.get(loc.state);
          const saved = existing.get(loc.state);
          const hasError = !!errorAt(e, `licenses.${i}`);
          const file: UploadItem[] = uploads[loc.state]
            ? [uploads[loc.state]!]
            : doc
              ? [{ id: doc.id, name: doc.fileName, size: doc.size, status: "done" }]
              : [];
          return (
            <li key={loc.state} className={cn("rounded-field border bg-white", hasError ? "border-red-300" : "border-warm-200")}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : loc.state)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 type-small font-semibold text-text-primary">
                    {loc.city}, {loc.state}
                    {saved && <Badge variant={licenseBadge[saved.status].variant}>{licenseBadge[saved.status].label}</Badge>}
                  </span>
                  <span className="type-small text-text-tertiary">Fill the form with the details</span>
                </span>
                <ChevronDownIcon aria-hidden className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")} />
              </button>
              <div hidden={!expanded} className="flex flex-col gap-5 border-t border-warm-200 p-4">
                <input type="hidden" {...register(`licenses.${i}.state`)} />
                <input type="hidden" {...register(`licenses.${i}.documentId`)} />
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-text-primary">
                    Upload license document <span aria-hidden className="text-destructive">*</span>
                  </p>
                  <UploadDropzone
                    label={doc ? "Replace file" : "Choose file"}
                    hint="PDF, JPG or PNG · Max 10MB"
                    accept={[...UPLOAD_RULES.license.types]}
                    maxBytes={UPLOAD_RULES.license.maxBytes}
                    files={file}
                    onFiles={([f]) => upload(i, loc.state, f)}
                    onRemove={() => {
                      setDocuments((d) => {
                        const next = new Map(d);
                        next.delete(loc.state);
                        return next;
                      });
                      setUploads((u) => ({ ...u, [loc.state]: undefined }));
                      setValue(`licenses.${i}.documentId`, "", { shouldDirty: true });
                    }}
                  />
                  <p className="type-small text-text-tertiary">
                    Your document is only seen by the Psychmind verification team. It is never shared publicly.
                  </p>
                  {errorAt(e, `licenses.${i}.documentId`) && (
                    <p role="alert" className="type-small text-destructive">{errorAt(e, `licenses.${i}.documentId`)}</p>
                  )}
                </div>
                <FormRow id={`lic-${i}-number`} label="License number" required error={errorAt(e, `licenses.${i}.licenseNumber`)}>
                  <Input id={`lic-${i}-number`} placeholder="e.g. SA-2665" {...register(`licenses.${i}.licenseNumber`)} />
                </FormRow>
                <FormRow id={`lic-${i}-body`} label="Issuing body" required error={errorAt(e, `licenses.${i}.issuingBody`)}>
                  <Input
                    id={`lic-${i}-body`}
                    placeholder={`e.g. ${stateName(loc.state)} Board of Psychology`}
                    {...register(`licenses.${i}.issuingBody`)}
                  />
                </FormRow>
              </div>
            </li>
          );
        })}
      </ul>

      {mode === "editor" && state.status === "approved" && (
        <p className="type-small text-text-tertiary">Changes to your licenses are re-checked by our team before they show as verified.</p>
      )}

      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
