// How providers are verified, and the privacy promise — shared by Home and
// How it works so both always say exactly the same thing. Grounded in the
// provider onboarding flow in the Figma file and the site's existing claims.
// TODO(client): confirm wording.
export const verifySteps = [
  { title: "Identity", body: "Every provider confirms who they are with a government-issued ID, checked by a person, not a bot." },
  { title: "License & credentials", body: "License numbers, degrees and qualification documents are reviewed before a profile ever goes live." },
  { title: "Practice details", body: "Location, session formats and fees are confirmed, so what you see on a profile is what you get." },
];

// The privacy promise: how we're different, then how it's done (the owner's
// brief, 2026-10-27). Each line is a fact about the code, so keep it true:
// the CSP in lib/csp.ts, the daily visitor hashes in server/analytics, no admin
// screen for session requests (cascade-deleted with the patient), HSTS in
// next.config.ts, and two-step login required for admins.
// TODO(client): new copy, replacing the four promises.
// Two lines, each in pieces, so the promises (strong) can be read on their own
// at a glance.
export const privacyIntro: { text: string; strong?: boolean }[][] = [
  [{ text: "Plenty of health sites make money from ads and the data behind them, " }, { text: "we don’t…", strong: true }],
  [
    { text: "Providers pay for their listing, so you’re never the product: " },
    { text: "no ads, no ad trackers, and we never sell your data.", strong: true },
  ],
];

// Each body fits two lines beside the picture on desktop; keep them that short.
export const privacyPromises = [
  {
    title: "No ads, no trackers",
    body: "No ad pixels, third-party analytics or session recordings. A strict security policy (CSP) blocks tracking servers.",
  },
  {
    title: "Counted, never followed",
    body: "Stats are daily totals with no cookies. The code that tells visitors apart is deleted every day.",
  },
  {
    title: "Requests stay between two people",
    body: "Only you and your chosen provider can open a request. Our admin tools can’t, and deleting your account erases it.",
  },
  {
    title: "Encrypted, with two-step login",
    body: "Everything travels over HTTPS and is stored encrypted. Two-step login is open to all and required for our team.",
  },
];
