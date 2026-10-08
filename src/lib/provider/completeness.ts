import {
  clientsSchema,
  credentialsSchema,
  expertiseSchema,
  identitySchema,
  locationsSchema,
  pictureSchema,
  practiceSchema,
  storySchema,
} from "./schema";
import type { ProviderState } from "./state";
import { ONBOARDING_STEPS, type StepKey } from "./steps";

// Which profile sections are complete, judged by the same schemas the forms
// use. The review step lists them, and submission refuses until all pass.

const checks: Record<Exclude<StepKey, "review">, (s: ProviderState) => boolean> = {
  identity: (s) => identitySchema.safeParse(s).success,
  picture: (s) => pictureSchema.safeParse({ photoId: s.photo?.id ?? "" }).success,
  story: (s) => storySchema.safeParse(s).success,
  clients: (s) => clientsSchema.safeParse(s).success,
  expertise: (s) => expertiseSchema.safeParse(s).success,
  practice: (s) =>
    practiceSchema.safeParse({
      ...s,
      feeIndividual: s.feeIndividual ?? "",
      feeCouples: s.feeCouples ?? "",
      education: s.education.map((e) => ({ ...e, year: e.year ?? "" })),
    }).success,
  locations: (s) => locationsSchema.safeParse({ locations: s.locations }).success,
  credentials: (s) =>
    s.locations.length > 0 &&
    s.locations.every((l) => s.licenses.some((lic) => lic.state === l.state)) &&
    credentialsSchema.safeParse({
      npiNumber: s.npiNumber,
      yearsExperience: s.yearsExperience ?? "",
      licenses: s.licenses.map((l) => ({ ...l, documentId: l.document?.id ?? "" })),
    }).success,
};

export type SectionStatus = { key: StepKey; title: string; complete: boolean };

export function sectionStatuses(state: ProviderState): SectionStatus[] {
  return ONBOARDING_STEPS.filter((s) => s.key !== "review").map((step) => ({
    key: step.key,
    title: step.key === "picture" ? "Your picture" : step.key === "clients" ? "Who you work with" : step.title,
    complete: checks[step.key as Exclude<StepKey, "review">](state),
  }));
}

export function isComplete(state: ProviderState) {
  return sectionStatuses(state).every((s) => s.complete);
}
