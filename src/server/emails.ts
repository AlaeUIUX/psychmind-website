import "server-only";
import { defaultOrigin } from "@/lib/hosts";
import { legalDetails } from "@/lib/legal";
import type { Email } from "./email";

// Email templates. One short message and one button, in the landing page's
// look (since 2026-10-30): the stone paper, a serif headline over plain text,
// the privacy promise's layers (a grey frame, a white card in it, a grey
// column in that), an ink button with the site's soft corners, then the site
// footer's sign-off with the voyage's boat at sea under it.
// Built from tables with inline styles so Gmail, Outlook and Apple Mail all
// render it (Outlook squares the corners); images are PNGs in /images/email
// (Gmail doesn't show SVG). No web fonts are loaded (no third-party hosts):
// STIX Two Text and Inter show where they're installed, Georgia and the
// system sans elsewhere. Weights stop at medium (500), as on the site.
// Privacy rule: emails carry links, not data, with one exception the owner
// decided on: a session request is forwarded to the provider with the
// patient's details and optional note, so their office can reply directly
// (as directory sites do). No tracking pixels. TODO(client): approve all email copy.

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const SERIF = "'STIX Two Text', 'Iowan Old Style', Georgia, 'Times New Roman', serif";
const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
// The site's stone greys (globals.css), written out: email has no variables.
const INK = "#1c1917"; // warm-900
const BODY = "#44403c"; // text-secondary
const LEDE = "#656360"; // type-hero-lede
const MUTED = "#78716c"; // warm-500: the footer's links and fine print
const FAINT = "#a8a29e"; // warm-400
const ARROW = "#d6d3d1"; // warm-300: the arrow on an ink button
const PAPER = "#fdfdfc"; // warm-25: the page
const HAIRLINE = "#e7e5e4"; // warm-200, ink at 10%
const FRAME = "#f4f4f3"; // the privacy promise's grey frame: ink at 4% on the paper
const COLUMN = "#f5f5f4"; // its grey column: ink at 4% on white
const ROW_RULE = "#ebe9e7"; // between rows in a grey column

/** Absolute origins: images and account links come from the app, footer links
 *  from the marketing site. */
function origins() {
  const app = (process.env.BETTER_AUTH_URL || defaultOrigin() || "https://www.psychmind.org").replace(/\/$/, "");
  const site = (process.env.NEXT_PUBLIC_MARKETING_URL || app).replace(/\/$/, "");
  return { app, site };
}

/** The sender's postal address (CAN-SPAM), in every email once it's set (lib/legal.ts). */
function postalLine() {
  const { companyName, postalAddress } = legalDetails();
  return postalAddress ? `${companyName}, ${postalAddress}` : null;
}

/** A full-width hairline, as the site footer draws between its parts. */
const hairline = (top: number) =>
  `<tr><td style="padding-top:${top}px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" style="height:1px;border-top:1px solid ${HAIRLINE};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>`;

/** The site footer's sign-off (site-footer.tsx): its call to action, the
 *  links, 988, the copyright and the small print, then the voyage's boat at
 *  sea (footer-scene.tsx, as a still with its edges dissolved into the paper). */
function siteFooter(smallPrint: string) {
  const { app, site } = origins();
  const postal = postalLine();
  const link = (href: string, label: string) => `<a href="${site}${href}" style="color:${MUTED};text-decoration:none">${label}</a>`;
  const dot = `<span style="color:${ARROW}">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>`;
  const call = (n: string) => `<a href="tel:${n}" style="color:${INK};text-decoration:none;font-weight:500">${n}</a>`;
  return `
      <tr><td align="center" style="padding:52px 8px 0">
        <p style="margin:0;font-family:${SERIF};font-weight:400;font-size:26px;line-height:32px;letter-spacing:-0.1px;color:${INK}">Ready to find help?</p>
        <p style="margin:8px 0 0;font-family:${SANS};font-size:15px;line-height:22px;color:${LEDE}">It takes less than two minutes. No referral needed</p>
        <p style="margin:18px 0 0;font-family:${SANS};font-size:13px;line-height:20px">${link("/how-it-works", "How it works")}${dot}${link("/blog", "Blog")}${dot}${link("/contact", "Contact")}</p>
      </td></tr>
      <tr><td style="padding:32px 0 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FRAME};border:1px solid ${HAIRLINE};border-radius:13px;border-collapse:separate">
          <tr><td align="center" style="padding:14px 20px;font-family:${SANS};font-size:13px;line-height:20px;color:${BODY}"><span style="color:${INK};font-weight:500">In crisis?</span> Call or text ${call("988")}, any time. In an emergency, call ${call("911")}.</td></tr>
        </table>
      </td></tr>
      ${hairline(32)}
      <tr><td align="center" style="padding:20px 8px 0;font-family:${SANS};font-size:12px;line-height:18px;color:${MUTED}">
        <img src="${app}/images/email/logo.png" width="14" height="14" alt="" style="display:inline-block;vertical-align:-2px;border:0">&nbsp; &copy; ${new Date().getFullYear()} PsychMind. All rights reserved.${dot}${link("/privacy-policy", "Privacy Policy")}${
          postal ? `<br>${escape(postal)}` : ""
        }
      </td></tr>
      <tr><td align="center" style="padding:12px 8px 0;font-family:${SANS};font-size:11px;line-height:16px;color:${FAINT}">${smallPrint}</td></tr>
      <tr><td style="padding:20px 0 0;font-size:0;line-height:0"><img src="${app}/images/email/footer-sea.png" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0"></td></tr>`;
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
  settingsUrl,
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
  /** Optional emails (lib/notifications.ts): where to turn them off. */
  settingsUrl?: string;
}) {
  const { app } = origins();
  // A grey column in the white card, as in the privacy promise: each row a
  // small medium label over its value (the search bar's segments).
  const detailRows = details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;background:${COLUMN};border-radius:8px;border-collapse:separate">${details
        .map(
          ([label, value], i) =>
            `<tr><td style="padding:10px 16px;${i ? `border-top:1px solid ${ROW_RULE};` : ""}font-family:${SANS}"><div style="font-size:12px;line-height:16px;font-weight:500;color:${MUTED}">${escape(label)}</div><div style="margin-top:2px;font-size:15px;line-height:22px;color:${INK};white-space:pre-line">${escape(value)}</div></td></tr>`,
        )
        .join("")}</table>`
    : "";
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0"><tr>
          <td bgcolor="${INK}" style="border-radius:12px">
            <a href="${escape(cta.url)}" style="display:inline-block;padding:13px 20px;font-family:${SANS};font-size:15px;font-weight:500;line-height:20px;color:#ffffff;text-decoration:none;border-radius:12px">${escape(cta.label)}&nbsp;&nbsp;<span style="color:${ARROW}">&rarr;</span></a>
          </td></tr></table>
        <p style="margin:18px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:${MUTED}">Button not working? Paste this link into your browser:<br><a href="${escape(cta.url)}" style="color:${BODY};word-break:break-all">${escape(cta.url)}</a></p>`
    : "";
  const preview = escape(preheader ?? body.replace(/<[^>]+>/g, ""));
  const smallPrint = `${escape(reason)}${
    unsubscribeUrl ? ` <a href="${escape(unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline">Unsubscribe from PsychMind marketing emails</a>.` : ""
  }${settingsUrl ? ` <a href="${escape(settingsUrl)}" style="color:${MUTED};text-decoration:underline">Choose which emails you get</a>.` : ""}`;

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
    .pm-pad { padding-left: 12px !important; padding-right: 12px !important; }
    .pm-card { padding: 28px 20px !important; }
    .pm-h1 { font-size: 26px !important; line-height: 32px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${PAPER};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAPER}">${preview}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER}">
  <tr><td align="center" class="pm-pad" style="padding:36px 24px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
      <tr><td style="padding:0 8px 20px">
        <a href="${app}" style="text-decoration:none;color:${INK}"><img src="${app}/images/email/logo.png" width="24" height="24" alt="" style="display:inline-block;vertical-align:middle;border:0">&nbsp;&nbsp;<span style="font-family:${SERIF};font-size:20px;line-height:24px;color:${INK};vertical-align:middle">PsychMind</span></a>
      </td></tr>
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FRAME};border:1px solid ${HAIRLINE};border-radius:20px;border-collapse:separate">
          <tr><td style="padding:6px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid ${HAIRLINE};border-radius:13px;border-collapse:separate">
              <tr><td class="pm-card" style="padding:36px 32px">
                <h1 class="pm-h1" style="margin:0 0 12px;font-family:${SERIF};font-weight:400;font-size:30px;line-height:36px;letter-spacing:-0.1px;color:${INK}">${escape(heading)}</h1>
                <p style="margin:0;font-family:${SANS};font-size:16px;line-height:26px;color:${BODY}">${body}</p>
                ${detailRows}
                ${button}
                ${footnote ? `<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${COLUMN};font-family:${SANS};font-size:13px;line-height:20px;color:${MUTED}">${escape(footnote)}</p>` : ""}
              </td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
      ${siteFooter(smallPrint)}
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
    settingsUrl ? `Choose which emails you get: ${settingsUrl}` : "",
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

/** A verified provider's changes (name, title, NPI, licenses) after review
 *  (lib/provider/review.ts). TODO(client): copy. */
export function profileChangesApprovedEmail(to: string, profileUrl: string): Email {
  return {
    to,
    subject: "Your PsychMind profile changes are live",
    ...layout({
      heading: "Your changes are live",
      body: "Our team checked the changes to your profile, and patients can see them now.",
      cta: { label: "View your profile", url: profileUrl },
    }),
  };
}

export function profileChangesDeclinedEmail(to: string, note: string, profileUrl: string): Email {
  return {
    to,
    subject: "About your PsychMind profile changes",
    ...layout({
      heading: "We couldn't approve your changes",
      body: "Our team couldn't approve the latest changes to your profile, so it still shows your verified details.",
      details: [["Note from our team", note]],
      cta: { label: "Review your profile", url: profileUrl },
      footnote: "Update the details and save them to send them for another check.",
    }),
  };
}

export function adminNewSubmissionEmail(to: string, reviewUrl: string, settingsUrl?: string): Email {
  return {
    to,
    subject: "New provider waiting for verification",
    ...layout({
      heading: "A provider is waiting for review",
      body: "A provider just submitted their profile for verification.",
      cta: { label: "Open the verification queue", url: reviewUrl },
      settingsUrl,
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
export function sessionRequestEmail(to: string, providerFirst: string, r: RequestDetails, requestsUrl: string, settingsUrl?: string): Email {
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
      settingsUrl,
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

/** Confirming a blog subscription (double opt-in): nothing is sent from the blog
 *  until this link is used. TODO(client): copy. */
export function blogSubscribeConfirmEmail(to: string, url: string): Email {
  return {
    to,
    subject: "Confirm your subscription to the PsychMind blog",
    ...layout({
      heading: "Confirm your subscription",
      body: "Confirm below and we'll email you new posts from the PsychMind blog. The link expires in 3 days.",
      cta: { label: "Confirm subscription", url },
      footnote: "If you didn't ask for this, ignore this email and you won't hear from us.",
      reason: "You're receiving this email because this address was entered on the PsychMind blog.",
    }),
  };
}

/** A message from the contact page, to the team (replies go to the sender).
 *  TODO(client): the copy. */
export function contactMessageEmail(
  to: string,
  m: { firstName: string; lastName: string; email: string; subject: string; message: string },
): Email {
  return {
    to,
    replyTo: m.email,
    subject: m.subject ? `[PsychMind Contact] ${m.subject}` : "[PsychMind Contact] New message",
    ...layout({
      heading: "New message from the contact page",
      body: "Reply to this email to answer them directly.",
      details: [
        ["Name", `${m.firstName} ${m.lastName}`],
        ["Email", m.email],
        ...(m.subject ? ([["Subject", m.subject]] as [string, string][]) : []),
        ["Message", m.message],
      ],
      reason: "You're receiving this email because PsychMind's contact page sends its messages here.",
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

export function adminRecoveryRequestEmail(to: string, reviewUrl: string, settingsUrl?: string): Email {
  return {
    to,
    subject: "New account recovery request",
    ...layout({
      heading: "Someone needs help getting into their account",
      body: "A new account recovery request is waiting. Check who they are before moving the account.",
      cta: { label: "Open account recovery", url: reviewUrl },
      reason: "You're receiving this email because you're a PsychMind admin.",
      settingsUrl,
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
