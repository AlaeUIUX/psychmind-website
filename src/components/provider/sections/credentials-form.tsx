"use client";

import { cn } from "cn";
import { CheckIcon, LockIcon, PencilIcon, ScaleIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { UploadDropzone, type UploadItem } from "@/components/app/upload-dropzone";
import { FormRow, describedBy } from "@/components/forms/form-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { credentialsSchema, type CredentialsInput } from "@/lib/provider/schema";
import type { UploadMeta } from "@/lib/provider/state";
import { UPLOAD_RULES } from "@/lib/provider/uploads";
import { stateName } from "@/lib/taxonomy";
import { formatsLabel } from "../profile-view";
import { uploadFile } from "../upload-client";
import { SectionFooter, type SectionProps, errorAt, hasErrorAt, useSectionForm } from "./shared";

type License = CredentialsInput["licenses"][number];
type Status = "missing" | "ready" | "pending" | "verified" | "rejected";

// TODO(client): status copy.
const STATUS: Record<Status, { label: string; className: string }> = {
  missing: { label: "License needed", className: "bg-amber-50 text-amber-800" },
  ready: { label: "Ready", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "In review", className: "bg-sky-50 text-sky-800" },
  verified: { label: "Verified", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Not verified", className: "bg-red-50 text-red-700" },
};

/** The state's code on a tile, as on the locations step; green once licensed. */
function StateTile({ code, done, active }: { code: string; done: boolean; active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-lg font-mono text-[13px] font-semibold tracking-wide transition-colors",
        active ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 ring-inset" : "bg-warm-100 text-warm-700",
      )}
    >
      {code}
      {done && (
        <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white">
          <CheckIcon className="size-2.5" strokeWidth={3.5} />
        </span>
      )}
    </span>
  );
}

// Figma P6 "Credentials & verification". Every practice location needs a
// license for its state — you can't see clients where you aren't licensed —
// so there's one license card per location from the previous step, and the
// step can't be saved until each has a number, issuing body and document.
// NPI and years of experience are per person, so they're asked once above the
// cards (Figma repeats them per state — flagged).
export function CredentialsForm({ state, mode, onPreview, backHref, nextHref }: SectionProps) {
  const docs = new Map(state.licenses.filter((l) => l.document).map((l) => [l.state, l.document!]));
  const [documents, setDocuments] = useState<Map<string, UploadMeta>>(docs);
  const [uploads, setUploads] = useState<Record<string, UploadItem | undefined>>({});

  const existing = new Map(state.licenses.map((l) => [l.state, l]));
  // The live preview shows each license number and the years in practice as typed.
  const toPreview = useCallback(
    (v: CredentialsInput) => ({
      yearsExperience: v.yearsExperience === "" || v.yearsExperience == null || Number.isNaN(Number(v.yearsExperience)) ? null : Number(v.yearsExperience),
      licenses: (v.licenses ?? []).filter((l) => l?.state && l.licenseNumber).map((l) => ({ state: l.state, licenseNumber: l.licenseNumber })),
    }),
    [],
  );
  const { form, onSubmit, pending } = useSectionForm({
    section: "credentials",
    schema: credentialsSchema,
    mode,
    nextHref,
    onPreview,
    toPreview,
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
  const { register, formState, setValue, watch } = form;
  const e = formState.errors;
  const licenses = watch("licenses") ?? [];

  const complete = (i: number) => {
    const l = licenses[i];
    return !!(l?.licenseNumber?.trim() && l.issuingBody?.trim() && l.documentId);
  };
  const statusOf = (i: number, stateCode: string): Status => {
    const saved = existing.get(stateCode);
    const l = licenses[i];
    const unchanged = saved && l && saved.licenseNumber === l.licenseNumber && saved.issuingBody === l.issuingBody && (saved.document?.id ?? "") === l.documentId;
    if (saved && unchanged) return saved.status;
    return complete(i) ? "ready" : "missing";
  };

  // The first location still missing a license starts open; after a failed
  // save, the first one with a problem opens itself.
  const [open, setOpen] = useState<number | null>(() => {
    const first = state.locations.findIndex((loc) => {
      const l = existing.get(loc.state);
      return !(l?.licenseNumber && l.issuingBody && l.document);
    });
    return first >= 0 ? first : null;
  });
  const firstError = state.locations.findIndex((_, i) => hasErrorAt(e, `licenses.${i}`));
  const expandedIndex = open ?? (firstError >= 0 ? firstError : null);
  const licensed = state.locations.filter((_, i) => complete(i)).length;

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

      <section aria-labelledby="licenses-title" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <h2 id="licenses-title" className="type-ui-label text-warm-900">
              Licenses
            </h2>
            <div className="flex items-center gap-3">
              <span className="type-ui-caption text-warm-500">
                {licensed} of {state.locations.length} locations licensed
              </span>
              <span aria-hidden className="flex gap-1">
                {state.locations.map((loc, i) => (
                  <span key={loc.state} className={cn("h-1.5 w-5 rounded-full transition-colors duration-300", complete(i) ? "bg-emerald-500" : "bg-warm-200")} />
                ))}
              </span>
            </div>
          </div>
          {/* TODO(client): copy */}
          <p className="flex items-start gap-1.5 type-ui-caption text-warm-500">
            <ScaleIcon aria-hidden className="mt-px size-3.5 shrink-0" />
            You can only see clients in states where you&apos;re licensed, so each location needs its own license.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {state.locations.map((loc, i) => {
            const expanded = expandedIndex === i;
            const doc = documents.get(loc.state);
            const hasError = hasErrorAt(e, `licenses.${i}`);
            const status = statusOf(i, loc.state);
            const l = licenses[i];
            const file: UploadItem[] = uploads[loc.state]
              ? [uploads[loc.state]!]
              : doc
                ? [{ id: doc.id, name: doc.fileName, size: doc.size, status: "done" }]
                : [];
            const summary = l?.licenseNumber
              ? [`License #${l.licenseNumber}`, l.issuingBody].filter(Boolean).join(" · ")
              : [loc.city, formatsLabel(loc.formats)].filter(Boolean).join(" · ");
            return (
              <li
                key={loc.state}
                className={cn(
                  "overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] duration-200",
                  hasError ? "border-red-300" : expanded ? "border-warm-300 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)]" : "border-warm-200",
                )}
              >
                <input type="hidden" {...register(`licenses.${i}.state`)} />
                <input type="hidden" {...register(`licenses.${i}.documentId`)} />

                <div className="flex items-center gap-3 p-3.5">
                  <StateTile code={loc.state} done={complete(i)} active={expanded} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 type-ui-heading text-warm-900">
                      <span className="truncate">
                        {loc.city}, {stateName(loc.state)}
                      </span>
                      <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium", STATUS[status].className)}>{STATUS[status].label}</span>
                    </p>
                    <p className={cn("truncate type-ui-caption", hasError ? "text-red-700" : "text-warm-500")}>
                      {/* TODO(client): copy */}
                      {hasError ? "Some details are missing" : summary}
                    </p>
                  </div>
                  {!expanded && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-[13px]"
                      onClick={() => setOpen(i)}
                      aria-label={`Edit the ${stateName(loc.state)} license`}
                    >
                      <PencilIcon />
                      {complete(i) ? "Edit" : "Add"}
                    </Button>
                  )}
                </div>

                {expanded && (
                  <div className="flex animate-ui-enter flex-col gap-5 border-t border-warm-200 p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormRow id={`lic-${i}-number`} label="License number" required error={errorAt(e, `licenses.${i}.licenseNumber`)}>
                        <Input id={`lic-${i}-number`} placeholder="e.g. SA-2665" {...register(`licenses.${i}.licenseNumber`)} />
                      </FormRow>
                      <FormRow id={`lic-${i}-body`} label="Issuing body" required error={errorAt(e, `licenses.${i}.issuingBody`)}>
                        <Input id={`lic-${i}-body`} placeholder={`e.g. ${stateName(loc.state)} Board of Psychology`} {...register(`licenses.${i}.issuingBody`)} />
                      </FormRow>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[13px] font-medium text-text-primary">
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
                      <p className="flex items-start gap-1.5 type-ui-caption text-warm-500">
                        <LockIcon aria-hidden className="mt-px size-3.5 shrink-0" />
                        Your document is only seen by the Psychmind verification team. It is never shared publicly.
                      </p>
                      {errorAt(e, `licenses.${i}.documentId`) && (
                        <p role="alert" className="type-small text-destructive">{errorAt(e, `licenses.${i}.documentId`)}</p>
                      )}
                    </div>
                    <div className="-mx-4 -mb-4 flex justify-end border-t border-warm-200 bg-warm-50/60 px-4 py-3 sm:-mx-5 sm:-mb-5 sm:px-5">
                      {/* TODO(client): copy */}
                      <Button type="button" variant="secondary" size="sm" className="h-8 px-3 text-[13px] shadow-none" onClick={() => setOpen(null)}>
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {mode === "editor" && state.status === "approved" && (
        <p className="type-small text-text-tertiary">Changes to your licenses are re-checked by our team before they show as verified.</p>
      )}

      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
