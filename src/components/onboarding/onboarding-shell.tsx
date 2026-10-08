"use client";

import { cn } from "cn";
import { CheckIcon, CircleCheckIcon, EyeIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProviderProfileView } from "@/components/provider/profile-view";
import { ONBOARDING_STEPS, PHASES, stepIndex, type StepKey } from "@/lib/provider/steps";
import type { ProfileView } from "@/lib/provider/types";
import { OnboardingProvider, useOnboarding } from "./onboarding-context";
import { PreviewPane } from "./preview-pane";

type ShellProps = {
  initial: ProfileView;
  /** Furthest step reached (steps after it are locked). */
  reached: string;
  /** Required sections that pass validation. */
  complete: string[];
  children: ReactNode;
};

/** How complete the profile looks (required sections + nice-to-haves). */
function strength(p: ProfileView, complete: string[]) {
  const required = complete.length / 8;
  const extras = [
    !!p.pronouns,
    (p.approaches?.length ?? 0) >= 2,
    (p.languages?.length ?? 0) >= 2,
    p.feeIndividual != null || p.feeCouples != null,
    (p.education?.length ?? 0) > 0,
    (p.about?.split(/\s+/).length ?? 0) > 80,
  ].filter(Boolean).length / 6;
  return Math.round((required * 0.8 + extras * 0.2) * 100);
}

function currentStep(path: string): StepKey | "welcome" | "submitted" {
  const seg = path.split("/")[3];
  if (!seg) return "welcome";
  if (seg === "submitted") return "submitted";
  return seg as StepKey;
}

function SaveStatus() {
  const { savedAt } = useOnboarding();
  // "now" only advances on a timer, so rendering stays pure.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const elapsed = savedAt ? Math.max(0, now - savedAt) : 0;
  const label = !savedAt
    ? "Progress saves at every step"
    : elapsed < 60_000
      ? "Saved just now"
      : `Saved ${Math.round(elapsed / 60_000)} min ago`;
  return (
    <span className="hidden items-center gap-1.5 type-ui-caption text-warm-500 sm:inline-flex" aria-live="polite">
      <CircleCheckIcon className={cn("size-3.5", savedAt ? "text-emerald-600" : "text-warm-400")} />
      {label}
    </span>
  );
}

function PhaseProgress({ step }: { step: StepKey | "welcome" | "submitted" }) {
  const index = step === "welcome" ? -1 : step === "submitted" ? ONBOARDING_STEPS.length : stepIndex(step);
  return (
    <ol className="hidden items-center gap-3 md:flex" aria-label="Setup progress">
      {PHASES.map((phase) => {
        const steps = ONBOARDING_STEPS.filter((s) => s.phase === phase.key);
        const first = stepIndex(steps[0].key);
        const done = Math.max(0, Math.min(steps.length, index - first));
        const active = index >= first && index < first + steps.length;
        return (
          <li key={phase.key} className="flex items-center gap-2">
            <span className={cn("type-ui-caption font-medium", active ? "text-warm-900" : done === steps.length ? "text-warm-600" : "text-warm-400")}>
              {phase.label}
            </span>
            <span className="flex gap-0.5" aria-hidden>
              {steps.map((s, i) => (
                <span
                  key={s.key}
                  className={cn(
                    "h-1 w-4 rounded-full transition-colors duration-500",
                    i < done ? "bg-warm-900" : i === done && active ? "bg-brand-primary" : "bg-warm-200",
                  )}
                />
              ))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StepRail({ step, reached, complete }: { step: StepKey | "welcome" | "submitted"; reached: string; complete: string[] }) {
  const { preview } = useOnboarding();
  const score = strength(preview, complete);
  return (
    <nav aria-label="Setup steps" className="flex flex-col gap-6">
      {PHASES.map((phase) => (
        <div key={phase.key} className="flex flex-col gap-1">
          <p className="px-2.5 pb-1 type-ui-caption font-medium tracking-wide text-warm-400 uppercase">{phase.label}</p>
          {ONBOARDING_STEPS.filter((s) => s.phase === phase.key).map((s) => {
            const isCurrent = s.key === step;
            const open = stepIndex(s.key) <= stepIndex(reached);
            const done = complete.includes(s.key);
            const content = (
              <>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors",
                    done ? "border-warm-900 bg-warm-900 text-white" : isCurrent ? "border-brand-primary text-brand-primary" : "border-warm-300 text-transparent",
                  )}
                >
                  {done ? <CheckIcon className="size-3" /> : isCurrent ? <span className="size-1.5 rounded-full bg-brand-primary" /> : null}
                </span>
                <span className="truncate">{s.label}</span>
              </>
            );
            const cls = cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-2.5 type-ui-small transition-colors",
              isCurrent ? "bg-white font-medium text-warm-900 shadow-sm ring-1 ring-warm-200" : open ? "text-warm-700 hover:bg-warm-100" : "cursor-not-allowed text-warm-400",
            );
            return open ? (
              <Link key={s.key} href={`/provider/onboarding/${s.key}`} aria-current={isCurrent ? "step" : undefined} className={cls}>
                {content}
              </Link>
            ) : (
              <span key={s.key} aria-disabled className={cls}>
                {content}
              </span>
            );
          })}
        </div>
      ))}

      <div className="flex flex-col gap-2.5 rounded-xl border border-warm-200 bg-white p-3.5">
        <div className="flex items-baseline justify-between">
          <span className="type-ui-label text-warm-800">Profile strength</span>
          <span className="type-ui-mono text-warm-600">{score}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-warm-100" aria-hidden>
          <div className="h-full rounded-full bg-linear-to-r from-brand-primary to-amber-500 transition-[width] duration-700 ease-out-soft" style={{ width: `${score}%` }} />
        </div>
        {/* TODO(client): copy */}
        <p className="type-ui-caption text-warm-500">Fees, education and a fuller story help people choose you.</p>
      </div>
    </nav>
  );
}

function Frame({ reached, complete, children }: Omit<ShellProps, "initial">) {
  const path = usePathname();
  const step = currentStep(path);
  const { preview, focusRegion } = useOnboarding();
  const stepRegion = ONBOARDING_STEPS.find((s) => s.key === step)?.region ?? null;
  const highlight = focusRegion ?? stepRegion;
  const showPreview = step !== "welcome" && step !== "submitted";

  return (
    <div className="app-ui flex min-h-svh flex-col bg-warm-50 text-warm-900">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-warm-200 bg-warm-50/85 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/provider" className="flex items-center gap-2" aria-label="PsychMind dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/home/logo.svg" alt="" width={24} height={24} />
            <span className="font-display text-[18px]">PsychMind</span>
          </Link>
          <span className="hidden h-4 w-px bg-warm-300 sm:block" />
          <span className="hidden type-ui-small text-warm-600 sm:block">Provider setup</span>
        </div>
        <PhaseProgress step={step} />
        <div className="flex items-center gap-3">
          <SaveStatus />
          {showPreview && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 shadow-none xl:hidden">
                  <EyeIcon />
                  Preview
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="app-ui max-h-[92svh] overflow-y-auto rounded-t-2xl p-0">
                <SheetHeader className="px-4 pt-4">
                  <SheetTitle>Your profile preview</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <ProviderProfileView profile={preview} mode="preview" highlight={highlight} />
                </div>
              </SheetContent>
            </Sheet>
          )}
          <Button asChild variant="ghost" size="sm" className="h-8">
            <Link href="/provider">
              <LogOutIcon />
              <span className="hidden sm:inline">Save &amp; exit</span>
            </Link>
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "mx-auto grid w-full flex-1 gap-8 px-4 py-8 sm:px-6",
          showPreview ? "max-w-[1480px] lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,560px)_minmax(0,1fr)]" : "max-w-[1200px]",
        )}
      >
        {showPreview && (
          <aside className="hidden lg:block">
            <div className="sticky top-22">
              <StepRail step={step} reached={reached} complete={complete} />
            </div>
          </aside>
        )}
        <main className="min-w-0">{children}</main>
        {showPreview && (
          <aside className="hidden xl:block" aria-label="Live preview">
            <div className="sticky top-22 h-[calc(100svh-7.5rem)]">
              <PreviewPane profile={preview} highlight={highlight} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export function OnboardingShell({ initial, ...rest }: ShellProps) {
  return (
    <OnboardingProvider initial={initial}>
      <Frame {...rest} />
    </OnboardingProvider>
  );
}
