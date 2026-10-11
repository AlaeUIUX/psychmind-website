import "server-only";
import type { ReminderDay } from "@/lib/onboarding-reminders";
import type { Email } from "@/server/email";
import { layout } from "@/server/emails";

// Abandoned-onboarding reminders (slice 4), sent by the daily cron
// (server/onboarding/reminders.ts). One link back to the wizard, nothing else.
// TODO(client): approve all copy in this file (new, not from Figma).

const COPY: Record<ReminderDay, { subject: string; heading: string; body: string }> = {
  1: {
    subject: "Finish your PsychMind profile",
    heading: "Pick up where you left off",
    body: "Your PsychMind profile is saved. Finish the remaining steps and submit it for verification, so people looking for care can find you.",
  },
  3: {
    subject: "Your PsychMind profile is almost ready",
    heading: "Your profile is waiting",
    body: "You're a few steps away from submitting your profile. Once it's in, we verify your credentials, usually within 1–2 business days.",
  },
  7: {
    subject: "Still want to join PsychMind?",
    heading: "Still want to join?",
    body: "Your profile is still saved as a draft. Finish it whenever you're ready and we'll take it from there.",
  },
};

export function onboardingReminderEmail(to: string, day: ReminderDay, onboardingUrl: string): Email {
  const copy = COPY[day];
  return {
    to,
    subject: copy.subject,
    ...layout({
      heading: copy.heading,
      body: copy.body,
      cta: { label: "Continue your profile", url: onboardingUrl },
      footnote: day === 7 ? "This is the last reminder we'll send about your draft." : undefined,
      reason: "You're receiving this email because you started a provider profile on PsychMind.",
    }),
  };
}
