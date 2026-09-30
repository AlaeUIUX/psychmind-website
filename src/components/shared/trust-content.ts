// How providers are verified, and the privacy promise — shared by Home and
// How it works so both always say exactly the same thing. Grounded in the
// provider onboarding flow in the Figma file and the site's existing claims.
// TODO(client): confirm wording.
export const verifySteps = [
  { title: "Identity", body: "Every provider confirms who they are with a government-issued ID, checked by a person — not a bot." },
  { title: "License & credentials", body: "License numbers, degrees and qualification documents are reviewed before a profile ever goes live." },
  { title: "Practice details", body: "Location, session formats and fees are confirmed, so what you see on a profile is what you get." },
];

export const privacyPromises = [
  "We never sell or share your information.",
  "Your search is yours alone — not your provider's, not a third party's.",
  "Messages with a provider stay between the two of you.",
  "Browse freely. No account, referral or diagnosis needed.",
];
