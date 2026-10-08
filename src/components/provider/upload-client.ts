"use client";

import type { UploadMeta } from "@/lib/provider/state";

/** Uploads one file to /api/uploads with progress (fetch can't report upload progress). */
export function uploadFile(
  file: File,
  kind: "photo" | "license",
  onProgress: (percent: number) => void,
): Promise<UploadMeta> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", kind);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: { error?: string } & Partial<UploadMeta> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.id) resolve(data as UploadMeta);
      else reject(new Error(data.error ?? "Upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(body);
  });
}
