"use client";

import { useEffect, useRef } from "react";
import { SectionForm } from "@/components/provider/section-form";
import { ReviewStep } from "@/components/provider/sections/review-step";
import type { SectionStatus } from "@/lib/provider/completeness";
import type { ProviderState } from "@/lib/provider/state";
import { ONBOARDING_STEPS, PHASES, regionForField, type StepKey } from "@/lib/provider/steps";
import { useOnboarding } from "./onboarding-context";

// One wizard step in the centre column: phase + count, title, the form in a
// card, and the sticky footer. Focusing a field highlights its spot in the
// live preview; ⌘/Ctrl + Enter saves and continues.
export function StepView({
  stepKey,
  state,
  sections,
  backHref,
  nextHref,
}: {
  stepKey: StepKey;
  state: ProviderState;
  sections: SectionStatus[];
  backHref: string | null;
  nextHref?: string;
}) {
  const { patchPreview, setFocusRegion } = useOnboarding();
  const root = useRef<HTMLDivElement>(null);
  const index = ONBOARDING_STEPS.findIndex((s) => s.key === stepKey);
  const step = ONBOARDING_STEPS[index];
  const phase = PHASES.find((p) => p.key === step.phase)!;

  useEffect(() => {
    setFocusRegion(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        root.current?.querySelector("form")?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepKey, setFocusRegion]);

  return (
    <div
      ref={root}
      className="flex flex-col gap-6"
      onFocusCapture={(e) => {
        const el = e.target as HTMLElement;
        const key = el.id || el.getAttribute("name") || el.closest("[data-field]")?.getAttribute("data-field") || "";
        const region = regionForField(key);
        if (region) setFocusRegion(region);
      }}
    >
      <header className="flex animate-ui-enter flex-col gap-2">
        <p className="flex items-center gap-2 type-ui-caption font-medium text-warm-500">
          <span>{phase.label}</span>
          <span aria-hidden className="size-0.5 rounded-full bg-warm-400" />
          <span className="type-ui-mono text-[12px]">
            Step {index + 1} of {ONBOARDING_STEPS.length}
          </span>
        </p>
        <h1 className="type-ui-title text-warm-900">{step.title}</h1>
        <p className="max-w-[520px] type-ui-body text-warm-600">{step.description}</p>
      </header>

      {state.status === "changes_requested" && state.reviewNote && (
        <div role="alert" className="animate-ui-enter rounded-xl bg-amber-50 p-4 type-ui-small text-amber-950 ring-1 ring-amber-200 ring-inset" style={{ "--i": 1 } as React.CSSProperties}>
          <p className="font-semibold">Changes requested by our team</p>
          <p className="mt-1 whitespace-pre-line">{state.reviewNote}</p>
        </div>
      )}

      <div className="animate-ui-enter rounded-2xl border border-warm-200 bg-white p-5 shadow-[0_1px_2px_rgb(28_25_23/0.04)] sm:p-7" style={{ "--i": 2 } as React.CSSProperties}>
        {stepKey === "review" ? (
          <ReviewStep sections={sections} backHref={backHref ?? "/provider/onboarding/credentials"} />
        ) : (
          <SectionForm section={stepKey} state={state} mode="wizard" onPreview={patchPreview} backHref={backHref} nextHref={nextHref} />
        )}
      </div>
    </div>
  );
}
