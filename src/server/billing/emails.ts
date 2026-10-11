import "server-only";
import type { Email } from "@/server/email";
import { layout } from "@/server/emails";

// Billing emails (slice 6), sent by server/billing/notices.ts. Links, not
// data: no amounts or card details, just where to fix it.
// TODO(client): approve all copy in this file (new, not from Figma).

const REASON = "You're receiving this email because of your PsychMind subscription.";

const longDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

export function paymentFailedEmail(to: string, billingUrl: string): Email {
  return {
    to,
    subject: "Your PsychMind payment didn't go through",
    ...layout({
      heading: "Your payment didn't go through",
      body: "We couldn't charge your card for your PsychMind listing. Your profile stays in search for 3 more days while you update your payment method. After that, it's hidden until the payment goes through.",
      cta: { label: "Update payment method", url: billingUrl },
      footnote: "Already updated it? Stripe retries the payment automatically, and we'll let you know when it goes through.",
      reason: REASON,
    }),
  };
}

export function profilePausedEmail(to: string, billingUrl: string): Email {
  return {
    to,
    subject: "Your PsychMind profile is paused",
    ...layout({
      heading: "Your profile is paused",
      body: "We still couldn't collect your payment, so your profile is hidden from search for now. Pay the balance and it goes live again within seconds.",
      cta: { label: "Pay now", url: billingUrl },
      reason: REASON,
    }),
  };
}

export function paymentRecoveredEmail(to: string, billingUrl: string): Email {
  return {
    to,
    subject: "Your PsychMind payment went through",
    ...layout({
      heading: "You're all set",
      body: "Thanks, your payment went through. Your profile is live in search again.",
      cta: { label: "Go to billing", url: billingUrl },
      reason: REASON,
    }),
  };
}

export function cancellationConfirmedEmail(to: string, endsAt: Date, billingUrl: string, now = new Date()): Email {
  const later = endsAt.getTime() > now.getTime();
  return {
    to,
    subject: "Your PsychMind subscription is canceled",
    ...layout({
      heading: "Your subscription is canceled",
      body: later
        ? `We've canceled your plan, so you won't be charged again. Your profile stays in search until ${longDate(endsAt)}.`
        : "We've canceled your plan, so you won't be charged again. Your profile is no longer shown in search.",
      details: [[later ? "Listing ends" : "Listing ended", longDate(endsAt)]],
      cta: { label: later ? "Restore your plan" : "Go to billing", url: billingUrl },
      footnote: later
        ? "Changed your mind? You can restore your plan from Billing any time before it ends."
        : "You can start a new plan from Billing whenever you're ready.",
      reason: REASON,
    }),
  };
}
