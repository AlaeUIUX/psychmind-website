"use client";

import { cn } from "cn";
import { LoaderCircleIcon, PlusIcon } from "@/components/ui/hugeicons";
import { useRef, useState } from "react";
import type { UploadItem } from "@/components/app/upload-dropzone";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UPLOAD_RULES } from "@/lib/provider/uploads";
import { DEFAULT_BANNER_URL } from "./profile-view";

// The profile banner as a row of small squares (owner, 2026-10-29): the
// default every account has (the gray water), the provider's own once they've
// uploaded one, and "+" to upload (click for the file picker, or drop a file;
// the crop dialog comes next). The chosen square is ringed in the portal blue.
// Choosing the default keeps their upload, so they can switch back.
// TODO(client): labels, hint and error copy.

const RULES = UPLOAD_RULES.banner;
const tile = "relative size-16 shrink-0 overflow-hidden rounded-lg outline-none transition-shadow focus-visible:ring-4 focus-visible:ring-ring/20";

function Choice({ on, label, url, onSelect }: { on: boolean; label: string; url: string; onSelect: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="radio"
          aria-checked={on}
          aria-label={label}
          onClick={onSelect}
          className={cn(tile, on ? "ring-2 ring-blue-600 ring-offset-2" : "ring-1 ring-warm-200 hover:ring-warm-400")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="size-full object-cover" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function BannerPicker({
  labelId,
  ownUrl,
  useDefault,
  upload,
  onChoose,
  onPick,
}: {
  /** The id of the visible "Banner" label. */
  labelId: string;
  /** The provider's uploaded banner, if any. */
  ownUrl: string | null;
  useDefault: boolean;
  /** A banner on its way up (or failed). */
  upload: UploadItem | null;
  onChoose: (useDefault: boolean) => void;
  /** A valid file was picked: crop it, then upload. */
  onPick: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const uploading = upload?.status === "uploading";
  const shownError = error ?? (upload?.status === "error" ? (upload.error ?? "Upload failed.") : null);

  const pick = (file?: File) => {
    if (!file) return;
    if (!(RULES.types as readonly string[]).includes(file.type)) return setError(`${file.name} isn't a supported file type.`);
    if (file.size > RULES.maxBytes) return setError(`${file.name} is larger than 5 MB.`);
    setError(null);
    onPick(file);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-3 p-0.5">
        <div role="radiogroup" aria-labelledby={labelId} className="flex items-center gap-3">
          <Choice on={!ownUrl || useDefault} label="Default banner" url={DEFAULT_BANNER_URL} onSelect={() => onChoose(true)} />
          {ownUrl && <Choice on={!useDefault} label="Your banner" url={ownUrl} onSelect={() => onChoose(false)} />}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={ownUrl ? "Upload a different banner" : "Upload a banner"}
              disabled={uploading}
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files[0]);
              }}
              className={cn(
                tile,
                "flex items-center justify-center border border-dashed border-warm-300 bg-white text-warm-500 hover:border-warm-400 hover:bg-warm-50 hover:text-warm-700 disabled:cursor-wait",
              )}
            >
              {uploading ? <LoaderCircleIcon aria-hidden className="size-5 animate-spin motion-reduce:animate-none" /> : <PlusIcon aria-hidden className="size-5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{ownUrl ? "Upload a different banner" : "Upload a banner"}</TooltipContent>
        </Tooltip>
        <input
          ref={input}
          type="file"
          accept={RULES.types.join(",")}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {shownError ? (
        <p role="alert" className="type-ui-caption text-destructive">
          {shownError}
        </p>
      ) : (
        <p className="type-ui-caption text-warm-500">Your branding or a photo of your practice. JPG, PNG or WebP, up to 5 MB.</p>
      )}
    </div>
  );
}
