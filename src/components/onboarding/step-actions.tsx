"use client";

import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { HoverArrow } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

/** Sticky wizard footer: Back · Continue, with the ⌘/Ctrl + Enter hint.
 *  While a file in the step is uploading, Continue waits ('Uploading…'). */
export function StepActions({
  backHref,
  submitLabel = "Save and continue",
  pending,
  uploading,
  disabled,
}: {
  backHref?: string | null;
  submitLabel?: string;
  pending?: boolean;
  uploading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-2 flex items-center justify-between gap-3 border-t border-warm-200 bg-warm-50/90 px-1 py-4 backdrop-blur-md">
      {backHref ? (
        <Button asChild variant="ghost" size="sm" className="h-10 px-3">
          <Link href={backHref}>
            <ArrowLeftIcon />
            Go back
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        <Kbd meta className="hidden sm:inline-flex" aria-hidden title="Save and continue">
          ↵
        </Kbd>
        <Button type="submit" size="default" className="h-10 px-4 text-[14px]" disabled={disabled || pending || uploading} aria-busy={pending || uploading || undefined}>
          {(pending || uploading) && <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />}
          {/* TODO(client): "Uploading…" */}
          {pending ? "Saving…" : uploading ? "Uploading…" : submitLabel}
          {!pending && !uploading && <HoverArrow />}
        </Button>
      </div>
    </div>
  );
}
