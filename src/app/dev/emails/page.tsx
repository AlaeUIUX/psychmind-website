import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renewalTerms } from "@/lib/billing";
import type { Email } from "@/server/email";
import {
  adminAccessEmail,
  adminNewSubmissionEmail,
  adminRecoveryRequestEmail,
  blogSubscribeConfirmEmail,
  contactMessageEmail,
  emailChangeConfirmEmail,
  emailChangedNoticeEmail,
  emailChangeStartEmail,
  existingAccountEmail,
  layout,
  passwordChangedEmail,
  profileChangesApprovedEmail,
  profileChangesDeclinedEmail,
  providerDecisionEmail,
  providerSubmittedEmail,
  recoveryCompletedEmail,
  recoveryDeclinedEmail,
  recoveryOwnerAlertEmail,
  recoveryReceivedEmail,
  resetPasswordEmail,
  sessionRequestEmail,
  sessionRequestSentEmail,
  subscriptionStartedEmail,
  verifyEmail,
} from "@/server/emails";
import { cancellationConfirmedEmail, paymentFailedEmail, paymentRecoveredEmail, profilePausedEmail } from "@/server/billing/emails";
import { onboardingReminderEmail } from "@/server/onboarding/emails";
import { EmailBrowser, type PreviewEmail } from "./email-browser";

export const metadata: Metadata = { title: "Emails — PsychMind", robots: { index: false } };
export const dynamic = "force-dynamic";

// Every email the app sends, rendered with sample data, for reviewing their
// design in one place (the inbox at /dev/mail only holds what was really sent).
// Hidden on the production site.

const APP = "https://app.psychmind.org";
const PATIENT = "jordan.miller@example.com";
const PROVIDER = "maya.ellison@example.com";
const ADMIN = "brenda@example.com";
const in3Days = new Date(Date.now() + 3 * 86_400_000);
const in20Days = new Date(Date.now() + 20 * 86_400_000);

const GROUPS: { group: string; emails: [name: string, email: Email][] }[] = [
  {
    group: "Accounts",
    emails: [
      ["Confirm your email", verifyEmail(PATIENT, `${APP}/api/auth/verify-email?token=sample`)],
      ["Already have an account", existingAccountEmail(PATIENT, `${APP}/login`, `${APP}/forgot-password`)],
      ["Reset your password", resetPasswordEmail(PATIENT, `${APP}/reset-password?token=sample`)],
      ["Password changed", passwordChangedEmail(PATIENT, `${APP}/forgot-password`)],
      ["Change email: confirm it's you", emailChangeStartEmail(PATIENT, `${APP}/change-email?token=sample`)],
      ["Change email: confirm the new one", emailChangeConfirmEmail("jordan@newmail.com", `${APP}/change-email/confirm?token=sample`)],
      ["Change email: done (old address)", emailChangedNoticeEmail(PATIENT, "jordan@newmail.com", `${APP}/account-recovery`)],
    ],
  },
  {
    group: "Session requests",
    emails: [
      [
        "New request (to the provider)",
        sessionRequestEmail(
          PROVIDER,
          "Maya",
          {
            name: "Jordan Miller",
            email: PATIENT,
            phone: "(555) 010-2030",
            sessionType: "Individual",
            format: "Online",
            note: "Looking for help with anxiety at work and trouble sleeping.",
          },
          `${APP}/provider/requests`,
          `${APP}/provider/settings`,
        ),
      ],
      ["Request sent (to the patient)", sessionRequestSentEmail(PATIENT, "Maya Ellison", { label: "See your requests", url: `${APP}/account` })],
    ],
  },
  {
    group: "Providers",
    emails: [
      ["Onboarding reminder, day 1", onboardingReminderEmail(PROVIDER, 1, `${APP}/provider/onboarding`, `${APP}/provider/settings`)],
      ["Onboarding reminder, day 3", onboardingReminderEmail(PROVIDER, 3, `${APP}/provider/onboarding`, `${APP}/provider/settings`)],
      ["Onboarding reminder, day 7", onboardingReminderEmail(PROVIDER, 7, `${APP}/provider/onboarding`, `${APP}/provider/settings`)],
      ["Profile submitted", providerSubmittedEmail(PROVIDER, `${APP}/provider`)],
      ["Verified", providerDecisionEmail(PROVIDER, "approved", `${APP}/provider`)],
      ["Changes requested", providerDecisionEmail(PROVIDER, "changes_requested", `${APP}/provider`)],
      ["Not verified", providerDecisionEmail(PROVIDER, "rejected", `${APP}/provider`)],
      ["Profile changes approved", profileChangesApprovedEmail(PROVIDER, `${APP}/provider/profile`)],
      [
        "Profile changes declined",
        profileChangesDeclinedEmail(PROVIDER, "The license number for Texas doesn't match the board's record. Upload the license again with the number as it appears there.", `${APP}/provider/profile`),
      ],
    ],
  },
  {
    group: "Billing",
    emails: [
      ["Listing active", subscriptionStartedEmail(PROVIDER, renewalTerms({ amount: "$10", interval: "month" }), `${APP}/provider/billing`)],
      ["Payment failed", paymentFailedEmail(PROVIDER, `${APP}/provider/billing`)],
      ["Profile paused", profilePausedEmail(PROVIDER, `${APP}/provider/billing`)],
      ["Payment recovered", paymentRecoveredEmail(PROVIDER, `${APP}/provider/billing`)],
      ["Canceled", cancellationConfirmedEmail(PROVIDER, in20Days, `${APP}/provider/billing`)],
    ],
  },
  {
    group: "Account recovery",
    emails: [
      ["Request received", recoveryReceivedEmail("jordan@newmail.com")],
      ["Heads-up to the account", recoveryOwnerAlertEmail(PATIENT, `${APP}/contact`)],
      ["Account is back", recoveryCompletedEmail("jordan@newmail.com", `${APP}/reset-password?token=sample`)],
      ["Couldn't verify", recoveryDeclinedEmail("jordan@newmail.com", "The name on the ID doesn't match the account. Send a new request with an ID that matches.")],
    ],
  },
  {
    group: "Team",
    emails: [
      ["New provider to verify", adminNewSubmissionEmail(ADMIN, `${APP}/admin/queue`, `${APP}/admin/settings`)],
      ["New recovery request", adminRecoveryRequestEmail(ADMIN, `${APP}/admin/recovery`, `${APP}/admin/settings`)],
      ["Admin account created", adminAccessEmail(ADMIN, "K7QW-M2PX-9RTV-H4ZN", in3Days, `${APP}/admin/login`, "new")],
      ["Admin access reset", adminAccessEmail(ADMIN, "B3NC-8KWD-Q5XR-T7MJ", in3Days, `${APP}/admin/login`, "reset")],
      [
        "Contact page message",
        contactMessageEmail("hello@psychmind.org", {
          firstName: "Jordan",
          lastName: "Miller",
          email: PATIENT,
          subject: "A question about providers",
          message: "Hi, do you list providers in Ohio yet?",
        }),
      ],
    ],
  },
  {
    group: "Blog",
    emails: [
      ["Confirm your subscription", blogSubscribeConfirmEmail(PATIENT, `${APP}/subscribe/sample`)],
      [
        "Marketing layout (sample, not sent yet)",
        {
          to: PATIENT,
          subject: "New on the PsychMind blog",
          ...layout({
            heading: "New on the blog",
            body: "A sample of the marketing layout: it carries the postal address and an unsubscribe link.",
            cta: { label: "Read the post", url: `${APP}/blog` },
            reason: "You're receiving this email because you subscribed to the PsychMind blog.",
            unsubscribeUrl: `${APP}/unsubscribe/sample`,
          }),
        },
      ],
    ],
  },
];

export default function DevEmailsPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const groups = GROUPS.map(({ group, emails }) => ({
    group,
    emails: emails.map(
      ([name, e], i): PreviewEmail => ({
        id: `${group}-${i}`,
        name,
        subject: e.subject,
        to: e.to,
        // Images from this page's own host: some browsers can't reach app.localhost.
        html: e.html.replace(/https?:\/\/[^"'\s]+?(\/images\/email\/)/g, "$1"),
      }),
    ),
  }));
  return <EmailBrowser groups={groups} />;
}
