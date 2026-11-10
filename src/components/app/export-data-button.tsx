"use client";

import { DownloadIcon } from "@/components/ui/hugeicons";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// "Download your data" (/api/account/export). A plain link saved errors
// ("too many downloads") as a file; this shows them instead. Copy approved by the owner, 2026-11-10.
export function ExportDataButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const download = async () => {
    setPending(true);
    setError(undefined);
    try {
      const res = await fetch("/api/account/export", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "We couldn't prepare your data. Please try again.");
        return;
      }
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "psychmind-data.json";
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("We couldn't reach PsychMind. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button type="button" variant="secondary" size="sm" className="h-9 px-3.5 text-[13px]" onClick={download} disabled={pending} aria-busy={pending || undefined}>
        <DownloadIcon />
        {pending ? "Preparing…" : "Download"}
      </Button>
      {error && (
        <p role="alert" className="max-w-[240px] text-right type-ui-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
