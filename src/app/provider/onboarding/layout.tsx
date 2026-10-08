import type { ReactNode } from "react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { sectionStatuses } from "@/lib/provider/completeness";
import { toProfileView } from "@/lib/provider/state";
import { stepIndex } from "@/lib/provider/steps";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";

// The onboarding shell persists across steps (rail, top bar and live preview
// stay mounted; only the step content re-enters). Pages decide redirects.
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const { user } = await requireRole("provider", "/provider/onboarding");
  const state = await loadProviderState(user.id);
  // A step counts as done once it passes validation *and* the provider has
  // been past it (optional-only steps would otherwise pass untouched).
  const reachedIndex = stepIndex(state.onboardingStep);
  const complete = sectionStatuses(state)
    .filter((s) => s.complete && stepIndex(s.key) < reachedIndex)
    .map((s) => s.key);
  return (
    <OnboardingShell initial={toProfileView(state)} reached={state.onboardingStep} complete={complete}>
      {children}
    </OnboardingShell>
  );
}
