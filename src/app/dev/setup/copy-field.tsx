"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** A value to paste somewhere else (Google Cloud, Vercel), with a copy button. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="type-ui-label text-text-secondary">{label}</span>
      <div className="flex items-center gap-2 rounded-field border border-warm-200 bg-warm-50 py-1 pr-1 pl-3">
        <code className="type-ui-mono min-w-0 flex-1 break-all text-text-primary" data-testid="copy-value">
          {value}
        </code>
        <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
          {copied ? <Check className="text-emerald-600" /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}
