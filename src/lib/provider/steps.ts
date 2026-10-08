// The provider onboarding wizard, in order, grouped into three phases.
// Figma has seven screens labelled "Step x of 5"; we add "Fees & background"
// (fields the patient side needs but onboarding never collected — build plan
// D2) and "Review and submit". Titles/descriptions are Figma copy where the
// screen exists. `region` is the part of the live preview the step fills in.

export type PreviewRegion =
  | "identity"
  | "banner"
  | "photo"
  | "who"
  | "about"
  | "specialties"
  | "credentials"
  | "fees"
  | "location";

// TODO(client): phase names are new copy.
export const PHASES = [
  { key: "profile", label: "About you" },
  { key: "practice", label: "Your practice" },
  { key: "verification", label: "Verification" },
] as const;

export type PhaseKey = (typeof PHASES)[number]["key"];

export const ONBOARDING_STEPS = [
  {
    key: "identity",
    phase: "profile",
    label: "Name & title",
    region: "identity",
    title: "Your identity",
    description: "This is the first thing patients see. Make a strong, warm first impression.",
  },
  {
    key: "picture",
    phase: "profile",
    label: "Photo",
    region: "photo",
    // TODO(client): Figma reuses "Your identity" here.
    title: "Add a photo",
    description: "A clear, friendly photo helps people feel at ease before they reach out.",
  },
  {
    key: "story",
    phase: "profile",
    label: "Your story",
    region: "about",
    title: "Your story",
    description: "Help clients understand who you are and how you work before they book.",
  },
  {
    key: "clients",
    phase: "practice",
    label: "Who you work with",
    region: "who",
    // TODO(client): Figma uses "Your expertise" for this screen too.
    title: "Who you work with",
    description: "Help clients understand who you are and how you work before they book.",
  },
  {
    key: "expertise",
    phase: "practice",
    label: "Expertise",
    region: "specialties",
    title: "Your expertise",
    description: "Help patients understand who you are and how you work before they book.",
  },
  {
    key: "practice",
    phase: "practice",
    label: "Fees & background",
    region: "fees",
    // TODO(client): new step — title and description.
    title: "Fees & background",
    description: "Share your session fees and training so patients know what to expect.",
  },
  {
    key: "locations",
    phase: "practice",
    label: "Locations",
    region: "location",
    title: "Practice locations",
    description: "Add the states where you are licensed to practice. Your base plan includes up to 3 locations.",
  },
  {
    key: "credentials",
    phase: "verification",
    label: "Licenses",
    region: "credentials",
    title: "Credentials & verification",
    description:
      "We manually verify every provider before their profile goes live. This usually takes 1–2 business days.",
  },
  {
    key: "review",
    phase: "verification",
    label: "Review & submit",
    region: "identity",
    // TODO(client): new step — title and description.
    title: "Review and submit",
    description: "Check your profile, then send it to our team for verification.",
  },
] as const satisfies readonly {
  key: string;
  phase: PhaseKey;
  label: string;
  region: PreviewRegion;
  title: string;
  description: string;
}[];

export type StepKey = (typeof ONBOARDING_STEPS)[number]["key"];
export const STEP_KEYS = ONBOARDING_STEPS.map((s) => s.key) as StepKey[];

export function stepIndex(key: string) {
  return STEP_KEYS.indexOf(key as StepKey);
}

export function nextStep(key: StepKey): StepKey | null {
  return STEP_KEYS[stepIndex(key) + 1] ?? null;
}

export function prevStep(key: StepKey): StepKey | null {
  return STEP_KEYS[stepIndex(key) - 1] ?? null;
}

/** The furthest of two steps (used to remember how far someone got). */
export function furthest(a: string, b: string): StepKey {
  return (stepIndex(a) >= stepIndex(b) ? a : b) as StepKey;
}

/** Which preview region a focused form field belongs to (by input id/name). */
export function regionForField(field: string): PreviewRegion | null {
  if (/^(firstName|lastName|titleCredentials|pronouns|businessName|displayAsBusiness|gender|acceptingNewClients)/.test(field)) return "identity";
  if (/^banner/.test(field)) return "banner";
  if (/^photo/.test(field)) return "photo";
  if (/^whoYouWorkWith|^session|^age/.test(field)) return "who";
  if (/^about/.test(field)) return "about";
  if (/^(specialt|primarySpecialty)/.test(field)) return "specialties";
  if (/^fee|^sliding/.test(field)) return "fees";
  if (/^loc-|^locations/.test(field)) return "location";
  if (/^(education|approach|language|npi|years|lic-|licenses)/.test(field)) return "credentials";
  return null;
}
