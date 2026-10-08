// The provider onboarding wizard, in order. Figma has seven screens (P1–P6
// with the picture split out) labelled "Step x of 5"; we add "Fees &
// background" (fields the patient side needs but onboarding never collected —
// build plan D2) and a final "Review and submit", and label real counts
// (D10). Titles/subtitles are Figma copy where the screen exists.

export const ONBOARDING_STEPS = [
  {
    key: "identity",
    title: "Your identity",
    description: "This is the first thing patients see. Make a strong, warm first impression.",
  },
  {
    key: "picture",
    title: "Your identity",
    description: "This is the first thing patients see. Make a strong, warm first impression.",
  },
  {
    key: "story",
    title: "Your story",
    description: "Help clients understand who you are and how you work before they book.",
  },
  {
    key: "clients",
    title: "Your expertise",
    description: "Help clients understand who you are and how you work before they book.",
  },
  {
    key: "expertise",
    title: "Your expertise",
    description: "Help patients understand who you are and how you work before they book.",
  },
  {
    key: "practice",
    // TODO(client): new step — title and description.
    title: "Fees & background",
    description: "Share your session fees and training so patients know what to expect.",
  },
  {
    key: "locations",
    title: "Practice locations",
    description: "Add the states where you are licensed to practice. Your base plan includes up to 3 locations.",
  },
  {
    key: "credentials",
    title: "Credentials & verification",
    description:
      "We manually verify every provider before their profile goes live. This usually takes 1–2 business days.",
  },
  {
    key: "review",
    eyebrow: "Final step",
    // TODO(client): new step — title and description.
    title: "Review and submit",
    description: "Check your profile, then send it to our team for verification.",
  },
] as const;

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
