"use client";

import { ArrowLeftIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProviderProfileView } from "./profile-view";
import type { ProfileView } from "@/lib/provider/types";

type StepFrameProps = {
  current: number;
  total: number;
  eyebrow?: string;
  title: string;
  description: string;
  /** The live preview's data (saved profile merged with the form's current values). */
  preview: ProfileView;
  /** Replace the preview with other art (e.g. Figma's "License compliance" card on Locations). */
  aside?: ReactNode;
  children: ReactNode;
};

// Figma wizard layout: a white card on warm grey — the form on the left, the
// live profile preview on the right. On phones the preview lives behind a
// "Preview profile" button in the header (Figma mobile wizard).
export function StepFrame({ current, total, eyebrow, title, description, preview, aside, children }: StepFrameProps) {
  return (
    <div className="flex min-h-svh flex-col bg-muted">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/provider" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/home/logo.svg" alt="" width={28} height={28} />
          <span className="font-display text-lg text-warm-900">PsychMind</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm" className="lg:hidden">
              <EyeIcon />
              Preview profile
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[92svh] overflow-y-auto rounded-t-card p-0">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle>Profile preview</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <ProviderProfileView profile={preview} mode="preview" />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-10 sm:px-8">
        <div className="grid w-full max-w-[1200px] overflow-hidden rounded-card border border-warm-200 bg-white shadow-card lg:grid-cols-[minmax(380px,460px)_1fr]">
          <section className="flex flex-col gap-8 p-6 sm:p-10">
            <div className="flex flex-col gap-3">
              <p className="type-small text-text-placeholder" aria-live="polite">
                {eyebrow ?? (
                  <>
                    Step <span className="font-semibold text-text-primary">{current}</span> of {total}
                  </>
                )}
              </p>
              <h1 className="type-h3 text-text-primary">{title}</h1>
              <p className="type-body text-text-tertiary">{description}</p>
            </div>
            {children}
          </section>
          <aside className="hidden border-l border-warm-200 bg-warm-50 p-8 lg:block">
            <div className="sticky top-8 max-h-[calc(100svh-4rem)] overflow-y-auto rounded-card">
              {aside ?? <ProviderProfileView profile={preview} mode="preview" />}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

/** Figma wizard footer: "Go back" (secondary, left arrow) and "Save and continue" (brand). */
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
    <div className="flex flex-col-reverse gap-3 border-t border-warm-200 pt-6 sm:flex-row sm:justify-between">
      {backHref ? (
        <Button asChild variant="secondary" size="md">
          <Link href={backHref}>
            <ArrowLeftIcon />
            Go back
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" variant="brand" size="md" disabled={disabled || pending} aria-busy={pending || undefined}>
        {pending && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
        {pending ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
