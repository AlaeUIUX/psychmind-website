"use client";

import { cn } from "cn";
import { useCallback, useState } from "react";
import { Controller } from "react-hook-form";
import type { UploadItem } from "@/components/app/upload-dropzone";
import { FormRow, describedBy } from "@/components/forms/form-row";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { identitySchema, type IdentityInput } from "@/lib/provider/schema";
import { fileUrl } from "@/lib/provider/state";
import { BannerPicker } from "../banner-picker";
import { PhotoCropDialog } from "../photo-crop-dialog";
import { uploadFile } from "../upload-client";
import { FormErrorSummary } from "@/components/forms/form-error-summary";
import { SectionFooter, type SectionProps, useSectionForm } from "./shared";

const PRONOUNS = ["She/her", "He/him", "They/them"];

// Figma P1 "Your identity". Business name (+ "Enlist with business name") comes
// from the provider sign-up screen (A2) and is editable here too; turning it
// on swaps the name on the live preview. The banner is the default gray water
// or the provider's own upload (cropped to 4:1), picked from small squares
// (BannerPicker; owner, 2026-10-29: colour swatches made the directory too
// colourful).
export function IdentityForm({ state, mode, onPreview, backHref, nextHref }: SectionProps) {
  const toPreview = useCallback(
    (v: IdentityInput) => ({
      firstName: v.firstName,
      lastName: v.lastName,
      titleCredentials: v.titleCredentials,
      pronouns: v.pronouns,
      bannerUrl: v.bannerId && !v.useDefaultBanner ? fileUrl(v.bannerId) : null,
      businessName: v.businessName,
      displayAsBusiness: v.displayAsBusiness,
    }),
    [],
  );
  const [bannerItem, setBannerItem] = useState<UploadItem | null>(null);
  const [pickedBanner, setPickedBanner] = useState<File | null>(null);
  const uploading = bannerItem?.status === "uploading";
  const { form, onSubmit, pending } = useSectionForm({
    section: "identity",
    schema: identitySchema,
    mode,
    nextHref,
    onPreview,
    toPreview,
    uploading,
    defaultValues: {
      firstName: state.firstName,
      lastName: state.lastName,
      titleCredentials: state.titleCredentials,
      pronouns: state.pronouns,
      bannerId: state.banner?.id ?? "",
      useDefaultBanner: state.useDefaultBanner,
      businessName: state.businessName,
      displayAsBusiness: state.displayAsBusiness,
    },
  });
  const { register, control, formState, watch, setValue } = form;
  const e = formState.errors;
  const pronouns = watch("pronouns");
  const bannerId = watch("bannerId");
  const useDefaultBanner = watch("useDefaultBanner");

  const uploadBanner = async (file: File) => {
    setBannerItem({ id: "new", name: file.name, size: file.size, status: "uploading", progress: 0 });
    try {
      const meta = await uploadFile(file, "banner", (progress) => setBannerItem((i) => (i ? { ...i, progress } : i)));
      setBannerItem(null);
      setValue("bannerId", meta.id, { shouldDirty: true });
      setValue("useDefaultBanner", false, { shouldDirty: true });
    } catch (err) {
      setBannerItem((i) => (i ? { ...i, status: "error", error: (err as Error).message } : i));
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormErrorSummary control={form.control} />
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

      <div className="flex flex-col gap-2.5" data-field="banner">
        <div className="flex items-baseline justify-between">
          <p id="banner-label" className="type-ui-label text-warm-800">
            Banner
          </p>
          <span className="type-ui-caption text-warm-400">Optional</span>
        </div>
        <BannerPicker
          labelId="banner-label"
          ownUrl={bannerId ? fileUrl(bannerId) : null}
          useDefault={useDefaultBanner}
          upload={bannerItem}
          onChoose={(useDefault) => setValue("useDefaultBanner", useDefault, { shouldDirty: true })}
          onPick={setPickedBanner}
        />
        {e.bannerId && (
          <p role="alert" className={cn("type-small text-destructive")}>
            {e.bannerId.message}
          </p>
        )}
        <PhotoCropDialog
          file={pickedBanner}
          shape="banner"
          onCancel={() => setPickedBanner(null)}
          onConfirm={(cropped) => {
            setPickedBanner(null);
            uploadBanner(cropped);
          }}
        />
      </div>

      <SectionFooter mode={mode} backHref={backHref} pending={pending} uploading={uploading} dirty={formState.isDirty} />
    </form>
  );
}
