"use client";

import { UserRoundIcon } from "lucide-react";
import { useState } from "react";
import { UploadDropzone, type UploadItem } from "@/components/app/upload-dropzone";
import { pictureSchema } from "@/lib/provider/schema";
import { fileUrl, type UploadMeta } from "@/lib/provider/state";
import { UPLOAD_RULES } from "@/lib/provider/uploads";
import { uploadFile } from "../upload-client";
import { SectionFooter, type SectionProps, useSectionForm } from "./shared";

// Figma P2 "Picture *": one photo, shown in the preview's avatar as soon as
// it's uploaded. Accepted types and size aren't in Figma (gap) — JPG, PNG or
// WebP up to 5 MB.
export function PictureForm({ state, mode, onPreview, backHref, nextHref }: SectionProps) {
  const [photo, setPhoto] = useState<UploadMeta | null>(state.photo);
  const [item, setItem] = useState<UploadItem | null>(null);
  const { form, onSubmit, pending } = useSectionForm({
    section: "picture",
    schema: pictureSchema,
    mode,
    nextHref,
    defaultValues: { photoId: state.photo?.id ?? "" },
  });

  const start = async (file: File) => {
    setItem({ id: "new", name: file.name, size: file.size, status: "uploading", progress: 0 });
    try {
      const meta = await uploadFile(file, "photo", (progress) =>
        setItem((i) => (i ? { ...i, progress } : i)),
      );
      setPhoto(meta);
      setItem(null);
      form.setValue("photoId", meta.id, { shouldDirty: true, shouldValidate: true });
      onPreview?.({ photoUrl: fileUrl(meta.id) });
    } catch (err) {
      setItem((i) => (i ? { ...i, status: "error", error: (err as Error).message } : i));
    }
  };

  const error = form.formState.errors.photoId?.message;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text-primary">
          Picture <span aria-hidden className="text-destructive">*</span>
        </p>
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-field border border-warm-200 bg-warm-100">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl(photo.id)} alt="Your profile picture" className="size-full object-cover" />
            ) : (
              <UserRoundIcon aria-hidden className="size-8 text-warm-300" />
            )}
          </div>
          <p className="type-small text-text-tertiary">
            {photo ? photo.fileName : "No file chosen"}
            <br />
            <span className="text-text-placeholder">A clear, friendly photo of your face works best.</span>
          </p>
        </div>
        <UploadDropzone
          label={photo ? "Choose a different picture" : "Choose file"}
          hint="Select a picture to upload. JPG, PNG or WebP, up to 5 MB."
          accept={[...UPLOAD_RULES.photo.types]}
          maxBytes={UPLOAD_RULES.photo.maxBytes}
          files={item ? [item] : []}
          onFiles={([file]) => start(file)}
          onRemove={() => setItem(null)}
        />
        {error && (
          <p role="alert" className="type-small text-destructive">
            {error}
          </p>
        )}
      </div>
      <SectionFooter
        mode={mode}
        backHref={backHref}
        pending={pending}
        dirty={form.formState.isDirty || mode === "wizard"}
        disabled={!photo}
      />
    </form>
  );
}
