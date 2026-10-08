"use client";

import { useCallback, useState } from "react";
import type { SectionStatus } from "@/lib/provider/completeness";
import { toProfileView, type ProviderState } from "@/lib/provider/state";
import { ONBOARDING_STEPS, type StepKey } from "@/lib/provider/steps";
import type { ProfileView } from "@/lib/provider/types";
import { SectionForm } from "./section-form";
import { ReviewStep } from "./sections/review-step";
import { LicenseComplianceCard } from "./sections/locations-form";
import { StepFrame } from "./step-frame";

// One wizard screen: the step's form on the left, the live preview on the right.
export function OnboardingStep({
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
  const [preview, setPreview] = useState<ProfileView>(() => toProfileView(state));
  const onPreview = useCallback((patch: Partial<ProfileView>) => setPreview((p) => ({ ...p, ...patch })), []);
  const index = ONBOARDING_STEPS.findIndex((s) => s.key === stepKey);
  const step = ONBOARDING_STEPS[index];

  return (
    <StepFrame
      current={index + 1}
      total={ONBOARDING_STEPS.length}
      eyebrow={"eyebrow" in step ? step.eyebrow : undefined}
      title={step.title}
      description={step.description}
      preview={preview}
      aside={stepKey === "locations" ? <LicenseComplianceCard /> : undefined}
    >
      {state.status === "changes_requested" && state.reviewNote && (
        <div role="alert" className="rounded-field border border-amber-200 bg-amber-50 p-4 type-small text-amber-950">
          <p className="font-semibold">Changes requested by our team</p>
          <p className="mt-1 whitespace-pre-line">{state.reviewNote}</p>
        </div>
      )}
      {stepKey === "review" ? (
        <ReviewStep sections={sections} backHref={backHref ?? "/provider/onboarding/credentials"} />
      ) : (
        <SectionForm section={stepKey} state={state} mode="wizard" onPreview={onPreview} backHref={backHref} nextHref={nextHref} />
      )}
    </StepFrame>
  );
}
