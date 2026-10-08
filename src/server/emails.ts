import "server-only";
import type { Email } from "./email";

// Email templates. Deliberately plain: a short line, one button, no personal
// or health details beyond the recipient's first name (privacy rule: emails
// carry links, not data). TODO(client): approve all email copy.

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout({ heading, body, cta, footnote }: { heading: string; body: string; cta?: { label: string; url: string }; footnote?: string }) {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${escape(cta.url)}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${escape(cta.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#fafaf9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1917">
<div style="max-width:520px;margin:0 auto;padding:40px 24px">
<p style="font-family:Georgia,serif;font-size:22px;margin:0 0 28px">PsychMind</p>
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;line-height:1.25;margin:0 0 12px">${escape(heading)}</h1>
<p style="font-size:16px;line-height:1.6;color:#44403c;margin:0">${body}</p>
${button}
${footnote ? `<p style="font-size:13px;line-height:1.5;color:#79716b;margin:0">${escape(footnote)}</p>` : ""}
<hr style="border:none;border-top:1px solid #e7e5e4;margin:32px 0 16px">
<p style="font-size:12px;color:#79716b;margin:0">In crisis? Call or text 988 any time, day or night. In an emergency, call 911.</p>
</div></body></html>`;
  const text = [heading, "", body.replace(/<[^>]+>/g, ""), cta ? `\n${cta.label}: ${cta.url}` : "", footnote ? `\n${footnote}` : ""].join("\n");
  return { html, text };
}

export function verifyEmail(to: string, url: string): Email {
  return {
    to,
    subject: "Confirm your email for PsychMind",
    ...layout({
      heading: "Confirm your email",
      body: "Tap the button below to confirm this is your email address and finish creating your account.",
      cta: { label: "Confirm email", url },
      footnote: "If you didn't create a PsychMind account, you can ignore this email.",
    }),
  };
}

export function resetPasswordEmail(to: string, url: string): Email {
  return {
    to,
    subject: "Reset your PsychMind password",
    ...layout({
      heading: "Reset your password",
      body: "Someone asked to reset the password for this account. If that was you, choose a new password below. The link expires in 30 minutes.",
      cta: { label: "Set a new password", url },
      footnote: "If you didn't ask for this, you can ignore this email — your password won't change.",
    }),
  };
}

export function providerSubmittedEmail(to: string, dashboardUrl: string): Email {
  return {
    to,
    subject: "We received your PsychMind profile",
    ...layout({
      heading: "Thanks — we're reviewing your profile",
      body: "We manually verify every provider before their profile goes live. This usually takes 1–2 business days. We'll email you as soon as there's an update.",
      cta: { label: "Go to your dashboard", url: dashboardUrl },
    }),
  };
}

export function providerDecisionEmail(
  to: string,
  decision: "approved" | "changes_requested" | "rejected",
  dashboardUrl: string,
): Email {
  const copy = {
    approved: {
      subject: "You're verified on PsychMind",
      heading: "You're verified",
      body: "Your credentials have been verified. Activate your listing to appear in search and start receiving session requests.",
      cta: "Activate your listing",
    },
    changes_requested: {
      subject: "Your PsychMind profile needs a few changes",
      heading: "A few changes are needed",
      body: "Our team reviewed your profile and needs a few updates before it can go live. You'll find the details in your dashboard.",
      cta: "See what to change",
    },
    rejected: {
      subject: "Update on your PsychMind application",
      heading: "We couldn't verify your profile",
      body: "Unfortunately we couldn't verify your credentials. You'll find more details in your dashboard, and you can reply to this email if you have questions.",
      cta: "View details",
    },
  }[decision];
  return { to, subject: copy.subject, ...layout({ heading: copy.heading, body: copy.body, cta: { label: copy.cta, url: dashboardUrl } }) };
}

export function adminNewSubmissionEmail(to: string, reviewUrl: string): Email {
  return {
    to,
    subject: "New provider waiting for verification",
    ...layout({
      heading: "A provider is waiting for review",
      body: "A provider just submitted their profile for verification.",
      cta: { label: "Open the verification queue", url: reviewUrl },
    }),
  };
}
