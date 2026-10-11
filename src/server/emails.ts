import "server-only";
import { defaultOrigin } from "@/lib/hosts";
import { legalDetails } from "@/lib/legal";
import type { Email } from "./email";

// Email templates. One short message and one button, in the landing page's
// look: serif headline, ink pill button, and the footer's lined notepad sheet
// (pink margin line, blue rules) with the founders' path illustration.
// Built from tables with inline styles so Gmail, Outlook and Apple Mail all
// render it; images are PNGs in /images/email (Gmail doesn't show SVG).
// Privacy rule: emails carry links, not data, with one exception the owner
// decided on: a session request is forwarded to the provider with the
// patient's details and optional note, so their office can reply directly
// (as directory sites do). No tracking pixels. TODO(client): approve all email copy.

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const SERIF = "'Ivar Display', Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const INK = "#1c1917";
const RULE = "#dceaf5";
const MARGIN_LINE = "#f695b6";

/** Absolute origins: images and account links come from the app, footer links
 *  from the marketing site. */
function origins() {
  const app = (process.env.BETTER_AUTH_URL || defaultOrigin() || "https://www.psychmind.org").replace(/\/$/, "");
  const site = (process.env.NEXT_PUBLIC_MARKETING_URL || app).replace(/\/$/, "");
  return { app, site };
}

/** One 32px line of the notepad: text resting on a blue rule. */
const ruledRow = (content: string, style = "") =>
  `<tr><td height="32" style="height:32px;border-bottom:1.5px solid ${RULE};padding:0 24px 0 20px;font-family:${SANS};font-size:13px;line-height:32px;color:#57534e;vertical-align:bottom;${style}">${content}</td></tr>`;

/** The sender's postal address (CAN-SPAM), in every email once it's set (lib/legal.ts). */
function postalLine() {
  const { companyName, postalAddress } = legalDetails();
  return postalAddress ? `${companyName}, ${postalAddress}` : null;
}

function notepadFooter() {
  const { app, site } = origins();
  const postal = postalLine();
  const link = (href: string, label: string) =>
    `<a href="${site}${href}" style="color:#44403c;text-decoration:none;font-weight:500">${label}</a>`;
  const dot = `<span style="color:#a8a29e">&nbsp;&middot;&nbsp;</span>`;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fefefe;border:1px solid #e7e5e4;border-radius:16px;border-collapse:separate;overflow:hidden">
  <tr>
    <td width="26" style="width:26px;border-right:2px solid ${MARGIN_LINE};font-size:0;line-height:0">&nbsp;</td>
    <td style="padding:24px 0 20px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding:0 24px 4px 20px"><img src="${app}/images/email/footer-illustration.png" width="240" height="160" alt="" style="display:block;width:240px;max-width:100%;height:auto;border:0"></td></tr>
        ${ruledRow(`<span style="font-family:${SERIF};font-size:20px;color:${INK}">Ready to find help?</span>`)}
        ${ruledRow("It takes less than two minutes. No referral needed")}
        ${ruledRow(`${link("/how-it-works", "How it works")}${dot}${link("/blog", "Blog")}${dot}${link("/contact", "Contact")}`)}
        ${ruledRow(`<strong style="color:${INK};font-weight:600">In crisis?</strong> Call or text 988, any time. In an emergency, call 911.`)}
        ${ruledRow(`<img src="${app}/images/email/logo.png" width="14" height="14" alt="" style="display:inline-block;vertical-align:-2px;border:0">&nbsp; &copy; ${new Date().getFullYear()} PsychMind. All rights reserved.${dot}${link("/privacy-policy", "Privacy Policy")}`, "color:#78716c")}
        ${postal ? ruledRow(escape(postal), "color:#78716c") : ""}
      </table>
    </td>
  </tr>
</table>`;
}

export function layout({
  heading,
  body,
  details,
  cta,
  footnote,
  preheader,
  reason = "You're receiving this email because of your PsychMind account.",
  unsubscribeUrl,
}: {
  heading: string;
  body: string;
  /** Label/value rows under the body (escaped here). */
  details?: [label: string, value: string][];
  cta?: { label: string; url: string };
  footnote?: string;
  /** Inbox preview line; defaults to the body. */
  preheader?: string;
  /** The small print at the very bottom. */
  reason?: string;
  /** Marketing email only (server/marketing.ts): the one-click way out. */
  unsubscribeUrl?: string;
}) {
  const { app } = origins();
  const detailRows = details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;border:1px solid #e7e5e4;border-radius:12px;border-collapse:separate">${details
        .map(
          ([label, value], i) =>
            `<tr><td style="padding:12px 16px;${i ? "border-top:1px solid #f5f5f4;" : ""}font-family:${SANS};font-size:12px;line-height:18px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em;width:120px;vertical-align:top">${escape(label)}</td><td style="padding:12px 16px;${i ? "border-top:1px solid #f5f5f4;" : ""}font-family:${SANS};font-size:15px;line-height:22px;color:${INK};white-space:pre-line">${escape(value)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0"><tr>
        <td bgcolor="${INK}" style="border-radius:999px">
          <a href="${escape(cta.url)}" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:15px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:999px">${escape(cta.label)}&nbsp;&nbsp;&rarr;</a>
        </td></tr></table>
      <p style="margin:20px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:#78716c">Button not working? Paste this link into your browser:<br><a href="${escape(cta.url)}" style="color:#57534e;word-break:break-all">${escape(cta.url)}</a></p>`
    : "";
  const preview = escape(preheader ?? body.replace(/<[^>]+>/g, ""));

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(heading)}</title>
<style>
  @media (max-width: 600px) {
    .pm-pad { padding-left: 16px !important; padding-right: 16px !important; }
    .pm-card { padding: 28px 22px !important; }
    .pm-h1 { font-size: 26px !important; line-height: 32px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f5f5f4">${preview}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f4">
  <tr><td align="center" class="pm-pad" style="padding:40px 24px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
      <tr><td style="padding:0 4px 24px">
        <a href="${app}" style="text-decoration:none;color:${INK}"><img src="${app}/images/email/logo.png" width="28" height="28" alt="" style="display:inline-block;vertical-align:middle;border:0">&nbsp;&nbsp;<span style="font-family:${SERIF};font-size:21px;line-height:28px;color:${INK};vertical-align:middle">PsychMind</span></a>
      </td></tr>
      <tr><td class="pm-card" style="background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;padding:40px">
        <h1 class="pm-h1" style="margin:0 0 14px;font-family:${SERIF};font-weight:400;font-size:30px;line-height:38px;letter-spacing:-0.01em;color:${INK}">${escape(heading)}</h1>
        <p style="margin:0;font-family:${SANS};font-size:16px;line-height:26px;color:#44403c">${body}</p>
        ${detailRows}
        ${button}
        ${footnote ? `<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #f5f5f4;font-family:${SANS};font-size:13px;line-height:20px;color:#78716c">${escape(footnote)}</p>` : ""}
      </td></tr>
      <tr><td style="padding:16px 0 0">${notepadFooter()}</td></tr>
      <tr><td style="padding:20px 4px 0;font-family:${SANS};font-size:11px;line-height:16px;color:#a8a29e;text-align:center">${escape(reason)}${
        unsubscribeUrl
          ? ` <a href="${escape(unsubscribeUrl)}" style="color:#57534e;text-decoration:underline">Unsubscribe from PsychMind marketing emails</a>.`
          : ""
      }</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    heading,
    "",
    body.replace(/<[^>]+>/g, ""),
    details?.length ? `\n${details.map(([l, v]) => `${l}: ${v}`).join("\n")}` : "",
    cta ? `\n${cta.label}: ${cta.url}` : "",
    footnote ? `\n${footnote}` : "",
    "\n—",
    "In crisis? Call or text 988, any time. In an emergency, call 911.",
    `© ${new Date().getFullYear()} PsychMind. All rights reserved.`,
    postalLine() ?? "",
    "",
    reason,
    unsubscribeUrl ? `Unsubscribe from PsychMind marketing emails: ${unsubscribeUrl}` : "",
  ]
    .join("\n")
    .trimEnd();
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

/** Someone signed up with an address that already has an account. The form
 *  answers like any sign-up (so it reveals nothing); the owner learns here.
 *  TODO(client): copy. */
export function existingAccountEmail(to: string, loginUrl: string, resetUrl: string): Email {
  return {
    to,
    subject: "You already have a PsychMind account",
    ...layout({
      heading: "You already have an account",
      body: `Someone just tried to create a PsychMind account with this email, but you already have one. Log in instead, or <a href="${escape(resetUrl)}" style="color:#1c1917">reset your password</a> if you've forgotten it.`,
      cta: { label: "Log in", url: loginUrl },
      footnote: "If this wasn't you, you can ignore this email. Nothing about your account changed.",
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

/** A temporary password for a new admin, or for one whose access was reset.
 *  TODO(client): copy. */
export function adminAccessEmail(to: string, tempPassword: string, expiresAt: Date, loginUrl: string, kind: "new" | "reset"): Email {
  const expires = expiresAt.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
  return {
    to,
    subject: kind === "new" ? "Your PsychMind admin account" : "Your PsychMind admin access was reset",
    ...layout({
      heading: kind === "new" ? "Your admin account is ready" : "Your admin access was reset",
      body:
        kind === "new"
          ? "An admin account was created for you on PsychMind. Log in with the temporary password below. Right after, you'll choose your own password and set up an authenticator app."
          : "Another admin reset your access. Log in with the temporary password below, then choose a new password and set up your authenticator app again.",
      details: [
        ["Email", to],
        ["Temporary password", tempPassword],
        ["Expires", expires],
      ],
      cta: { label: "Log in to PsychMind admin", url: loginUrl },
      footnote: "Don't forward this email. If you weren't expecting it, let the PsychMind team know.",
      preheader: "Your temporary password is inside. It expires in a few days.",
      reason: "You're receiving this email because you were made a PsychMind admin.",
    }),
  };
}

/** The acknowledgment after checkout that automatic renewal laws ask for:
 *  the terms they agreed to, and how to cancel. TODO(client): copy. */
export function subscriptionStartedEmail(to: string, terms: string, billingUrl: string): Email {
  return {
    to,
    subject: "Your PsychMind listing is active",
    ...layout({
      heading: "Your listing is active",
      body: "Thanks for subscribing. Here are the automatic renewal terms you agreed to. Keep this email for your records.",
      details: [["Renewal terms", terms]],
      cta: { label: "Manage billing or cancel", url: billingUrl },
      footnote: "You can cancel online anytime from Billing → Manage billing. Cancelling stops the next renewal.",
      reason: "You're receiving this email because you subscribed to a PsychMind plan.",
    }),
  };
}

export type RequestDetails = {
  name: string;
  email: string;
  phone?: string | null;
  sessionType: string;
  format: string;
  note?: string | null;
};

/** A session request, forwarded to the provider's requests address. Replying
 *  answers the patient directly (Reply-To). */
export function sessionRequestEmail(to: string, providerFirst: string, r: RequestDetails, requestsUrl: string): Email {
  return {
    to,
    replyTo: r.email,
    // No patient name in the subject: it shows on lock screens.
    subject: "New session request on PsychMind",
    ...layout({
      heading: "New session request",
      body: `Someone would like a session with ${escape(providerFirst)}. Reply to this email to reach them directly. They've been told to expect a reply within 2 days.`,
      details: [
        ["Name", r.name],
        ["Email", r.email],
        ...(r.phone ? ([["Phone", r.phone]] as [string, string][]) : []),
        ["Session type", r.sessionType],
        ["Format", r.format],
        ...(r.note ? ([["Note", r.note]] as [string, string][]) : []),
      ],
      cta: { label: "See all requests", url: requestsUrl },
      footnote: "These details were shared with you so you can respond to this request. Please don't use them for anything else.",
      reason: "You're receiving this email because session requests for your PsychMind profile are sent to this address.",
    }),
  };
}

/** The patient's copy: no note, no health details. */
export function sessionRequestSentEmail(to: string, providerName: string, cta: { label: string; url: string }): Email {
  return {
    to,
    // Generic on purpose: the subject shows on lock screens and in inbox lists.
    subject: "Your session request was sent",
    ...layout({
      heading: "Your request was sent",
      body: `We sent your request to ${escape(providerName)}. They usually reply within 2 days, by email or phone. If you don't hear back, you can request a session with another provider.`,
      cta,
      footnote: "If you didn't make this request, you can ignore this email.",
      reason: "You're receiving this email because a session request was sent with this address on PsychMind.",
    }),
  };
}

// Changing your email or password, and account recovery when the old inbox
// is gone (server/account/email-change.ts, server/account/recovery.ts).
// TODO(client): copy for every email below.

/** "n•••@gmail.com": enough to recognise an address without spelling it out. */
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  return `${local.slice(0, 1)}•••@${domain}`;
}

/** Step 1 of changing your email: proof that the current inbox is yours. */
export function emailChangeStartEmail(to: string, url: string): Email {
  return {
    to,
    subject: "Confirm it's you to change your PsychMind email",
    ...layout({
      heading: "Confirm it's you",
      body: "You asked to change the email on your PsychMind account. Continue below to choose your new email. The link expires in 30 minutes.",
      cta: { label: "Choose a new email", url },
      footnote: "If you didn't ask for this, you can ignore this email and nothing will change. If you think someone else knows your password, change it in Settings.",
    }),
  };
}

/** Step 2: proof that the new inbox is theirs too. */
export function emailChangeConfirmEmail(to: string, url: string): Email {
  return {
    to,
    subject: "Confirm your new email for PsychMind",
    ...layout({
      heading: "Confirm your new email",
      body: "Tap the button below to make this your PsychMind email. The link expires in 30 minutes.",
      cta: { label: "Confirm new email", url },
      footnote: "If you didn't ask for this, you can ignore this email.",
    }),
  };
}

/** To the old address once the change is done. */
export function emailChangedNoticeEmail(to: string, newEmail: string, helpUrl: string, bySupport = false): Email {
  return {
    to,
    subject: "Your PsychMind email was changed",
    ...layout({
      heading: "Your email was changed",
      body: `${bySupport ? "Our support team moved your PsychMind account" : "Your PsychMind account was moved"} to ${escape(maskEmail(newEmail))}. Account emails won't come to this address anymore.`,
      cta: { label: "This wasn't me", url: helpUrl },
      footnote: "If you made this change, there's nothing else to do.",
    }),
  };
}

export function passwordChangedEmail(to: string, resetUrl: string): Email {
  return {
    to,
    subject: "Your PsychMind password was changed",
    ...layout({
      heading: "Your password was changed",
      body: "The password for your PsychMind account was just changed, and you were logged out everywhere else.",
      cta: { label: "This wasn't me: reset it", url: resetUrl },
      footnote: "If you made this change, there's nothing else to do.",
    }),
  };
}

/** To the address they want to be reached at. Says the same whether or not
 *  an account matched. */
export function recoveryReceivedEmail(to: string): Email {
  return {
    to,
    subject: "We got your account recovery request",
    ...layout({
      heading: "We got your request",
      body: "Our support team will check your details and reply to this address, usually within 2 business days. For your security, nothing on any account changes until a person has verified who you are.",
      footnote: "If you didn't ask for this, you can ignore this email.",
      reason: "You're receiving this email because this address was given in a PsychMind account recovery request.",
    }),
  };
}

/** To the account's current address: a heads-up, in case it's not them. */
export function recoveryOwnerAlertEmail(to: string, helpUrl: string): Email {
  return {
    to,
    subject: "Someone asked to move your PsychMind account",
    ...layout({
      heading: "A request to move your account",
      body: "Someone asked our support team to move your PsychMind account to a different email address. We check identity before making any change. If this was you, there's nothing to do.",
      cta: { label: "This wasn't me", url: helpUrl },
      footnote: "If this wasn't you, tell us and we'll keep your account as it is. It's also a good moment to turn on two-step login in Settings.",
    }),
  };
}

export function adminRecoveryRequestEmail(to: string, reviewUrl: string): Email {
  return {
    to,
    subject: "New account recovery request",
    ...layout({
      heading: "Someone needs help getting into their account",
      body: "A new account recovery request is waiting. Check who they are before moving the account.",
      cta: { label: "Open account recovery", url: reviewUrl },
      reason: "You're receiving this email because you're a PsychMind admin.",
    }),
  };
}

/** Approved: the account now uses this address; a link to choose a password. */
export function recoveryCompletedEmail(to: string, passwordUrl: string): Email {
  return {
    to,
    subject: "Your PsychMind account is back",
    ...layout({
      heading: "Your account is back",
      body: "We verified your request, and your PsychMind account now uses this email address. Choose a new password to log in. The link expires in 24 hours.",
      cta: { label: "Choose a password", url: passwordUrl },
      footnote: "After you log in, we recommend turning on two-step login in Settings, so you can always prove it's you.",
    }),
  };
}

export function recoveryDeclinedEmail(to: string, note: string): Email {
  return {
    to,
    subject: "About your account recovery request",
    ...layout({
      heading: "We couldn't verify your request",
      body: "We looked at your account recovery request but couldn't confirm the account is yours, so nothing was changed.",
      details: [["Note from our team", note]],
      footnote: "You can send a new request with more details anytime.",
      reason: "You're receiving this email because this address was given in a PsychMind account recovery request.",
    }),
  };
}
