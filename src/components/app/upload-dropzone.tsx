"use client";

import { cn } from "cn";
import { FileTextIcon, RotateCwIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type UploadItem = {
  id: string;
  name: string;
  size: number;
  /** 0–100 while uploading. */
  progress?: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

type UploadDropzoneProps = {
  label: string;
  /** e.g. "PDF, JPG or PNG, up to 10 MB" — shown under the drop area. */
  hint?: string;
  /** MIME types or extensions, as for <input accept>. */
  accept: string[];
  maxBytes: number;
  multiple?: boolean;
  files: UploadItem[];
  /** Called with files that passed type/size checks; the parent uploads them and updates `files`. */
  onFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Files rejected before upload, with the reason (shown inline). */
  onReject?: (rejections: { file: File; reason: string }[]) => void;
  disabled?: boolean;
  className?: string;
};

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matches(file: File, accept: string[]) {
  const name = file.name.toLowerCase();
  return accept.some((rule) =>
    rule.startsWith(".")
      ? name.endsWith(rule.toLowerCase())
      : rule.endsWith("/*")
        ? file.type.startsWith(rule.slice(0, -1))
        : file.type === rule,
  );
}

// Drag-and-drop or click-to-browse upload (license documents, profile photo).
// Checks type and size up front, then lists each file with progress, an
// inline error + retry, or a remove button. The actual upload happens in the
// parent (Supabase Storage signed upload), which feeds progress back in.
// TODO(client): copy for the drop area and errors.
export function UploadDropzone({
  label,
  hint,
  accept,
  maxBytes,
  multiple = false,
  files,
  onFiles,
  onRemove,
  onRetry,
  onReject,
  disabled,
  className,
}: UploadDropzoneProps) {
  const inputId = useId();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const take = (list: FileList | null) => {
    if (!list || disabled) return;
    const picked = Array.from(list).slice(0, multiple ? undefined : 1);
    const ok: File[] = [];
    const bad: { file: File; reason: string }[] = [];
    for (const file of picked) {
      if (!matches(file, accept)) bad.push({ file, reason: `${file.name} isn't a supported file type.` });
      else if (file.size > maxBytes) bad.push({ file, reason: `${file.name} is larger than ${formatBytes(maxBytes)}.` });
      else ok.push(file);
    }
    setRejected(bad.length ? bad.map((b) => b.reason).join(" ") : null);
    if (bad.length) onReject?.(bad);
    if (ok.length) onFiles(ok);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    take(e.dataTransfer.files);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-field border border-dashed px-6 py-8 text-center transition-[background-color,border-color] duration-200",
          "has-focus-visible:border-warm-600 has-focus-visible:ring-4 has-focus-visible:ring-ring/12",
          dragging ? "border-warm-800 bg-warm-100" : "border-warm-300 bg-white hover:border-warm-600 hover:bg-warm-50",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-warm-100 text-warm-700">
          <UploadCloudIcon className="size-5" />
        </span>
        <span className="type-small text-text-secondary">
          <span className="font-semibold text-text-primary">{label}</span> or drag and drop
        </span>
        {hint && (
          <span id={hintId} className="type-caption text-text-placeholder">
            {hint}
          </span>
        )}
        <input
          ref={input}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept.join(",")}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(e) => {
            take(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {rejected && (
        <p role="alert" className="type-small text-destructive">
          {rejected}
        </p>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className={cn(
                "flex items-center gap-3 rounded-field border bg-white px-3.5 py-3",
                file.status === "error" ? "border-red-200" : "border-warm-200",
              )}
            >
              <FileTextIcon aria-hidden className="size-5 shrink-0 text-warm-600" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate type-small font-medium text-text-primary">{file.name}</span>
                  <span className="shrink-0 type-caption text-text-placeholder">{formatBytes(file.size)}</span>
                </div>
                {file.status === "uploading" && (
                  <Progress value={file.progress ?? 0} aria-label={`Uploading ${file.name}`} className="h-1.5" />
                )}
                {file.status === "error" && (
                  <span className="type-caption text-destructive">{file.error ?? "Upload failed."}</span>
                )}
              </div>
              {file.status === "error" && onRetry && (
                <Button variant="ghost" size="icon-sm" aria-label={`Retry ${file.name}`} onClick={() => onRetry(file.id)}>
                  <RotateCwIcon />
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={() => onRemove(file.id)}>
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
