"use client";

import { ArrowLeftIcon, ArrowRightIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

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
  const mac = useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );

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
        <span className="hidden type-ui-caption text-warm-400 sm:inline" aria-hidden>
          <kbd className="rounded border border-warm-300 bg-white px-1 font-sans">{mac ? "⌘" : "Ctrl"}</kbd>{" "}
          <kbd className="rounded border border-warm-300 bg-white px-1 font-sans">↵</kbd>
        </span>
        <Button type="submit" size="default" className="h-10 px-4 text-[14px]" disabled={disabled || pending} aria-busy={pending || undefined}>
          {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
          {!pending && <ArrowRightIcon />}
        </Button>
      </div>
    </div>
  );
}
