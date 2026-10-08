"use client";

import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { HoverArrow } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

/** Sticky wizard footer: Back · Continue, with the ⌘/Ctrl + Enter hint. */
export function StepActions({
  backHref,
  submitLabel = "Save and continue",
  pending,
  disabled,
}: {
  backHref?: string | null;
  submitLabel?: string;
  pending?: boolean;
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
        <Button type="submit" size="default" className="h-10 px-4 text-[14px]" disabled={disabled || pending} aria-busy={pending || undefined}>
          {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
          {!pending && <HoverArrow />}
        </Button>
      </div>
    </div>
  );
}
