import "server-only";
import { defaultOrigin } from "@/lib/hosts";
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

function notepadFooter() {
  const { app, site } = origins();
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
      </table>
    </td>
  </tr>
</table>`;
}

function layout({
  heading,
  body,
  details,
  cta,
  footnote,
  preheader,
  reason = "You're receiving this email because of your PsychMind account.",
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
      <tr><td style="padding:20px 4px 0;font-family:${SANS};font-size:11px;line-height:16px;color:#a8a29e;text-align:center">${escape(reason)}</td></tr>
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
  ].join("\n");
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
