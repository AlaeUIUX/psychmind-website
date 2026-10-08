import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StepView } from "@/components/onboarding/step-view";
import { sectionStatuses } from "@/lib/provider/completeness";
import { STEP_KEYS, nextStep, prevStep, stepIndex, type StepKey } from "@/lib/provider/steps";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";

export const metadata: Metadata = { title: "Set up your profile — PsychMind", robots: { index: false } };

export default async function OnboardingStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!STEP_KEYS.includes(step as StepKey)) notFound();
  const { user } = await requireRole("provider", `/provider/onboarding/${step}`);
  const state = await loadProviderState(user.id);

  // The wizard is for building a profile; once submitted, the dashboard takes over.
  if (state.status === "submitted") redirect("/provider/onboarding/submitted");
  if (state.status !== "draft" && state.status !== "changes_requested") redirect("/provider");
  // Don't let people skip ahead of where they've got to.
  if (stepIndex(step) > stepIndex(state.onboardingStep)) redirect(`/provider/onboarding/${state.onboardingStep}`);

  const key = step as StepKey;
  const prev = prevStep(key);
  const next = nextStep(key);
  return (
    <StepView
      key={key}
      stepKey={key}
      state={state}
      sections={sectionStatuses(state)}
      backHref={prev ? `/provider/onboarding/${prev}` : "/provider/onboarding"}
      nextHref={next ? `/provider/onboarding/${next}` : undefined}
    />
  );
}
