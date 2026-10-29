// What's new: the changelog providers (and the team) see in their dashboard.
// The team edits this list; newest first. An entry shows to its audience
// ("all" shows to both). The sidebar marks What's new with a dot until the
// newest entry has been seen (per browser).
// TODO(client): every entry's copy.

export type ChangelogTag = "New" | "Improved" | "Fixed";

export type ChangelogEntry = {
  /** Stable and unique: it's what "seen" remembers. */
  id: string;
  /** YYYY-MM-DD. */
  date: string;
  title: string;
  body: string;
  audience: "provider" | "admin" | "all";
  tag?: ChangelogTag;
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-10-29-dashboard",
    date: "2026-10-29",
    title: "A dashboard of your own",
    body: "Everything for your practice now sits in one sidebar: your overview and account health, requests, analytics, profile, billing and settings.",
    audience: "all",
    tag: "New",
  },
  {
    id: "2026-10-29-verified-seal",
    date: "2026-10-29",
    title: "Your verified seal, everywhere",
    body: "Once our team has checked your license, a verified seal sits beside your name in search results, the quick look and your profile.",
    audience: "provider",
    tag: "Improved",
  },
  {
    id: "2026-10-29-search",
    date: "2026-10-29",
    title: "One search, from the home page to the results",
    body: "Patients now search with the same bar on the home page and on the results, so the way they find you feels like one product.",
    audience: "all",
    tag: "Improved",
  },
];

/** Entries for one audience, newest first. */
export function changelogFor(audience: "provider" | "admin") {
  return CHANGELOG.filter((e) => e.audience === audience || e.audience === "all");
}

/** Where a browser remembers the newest entry it has seen. */
export const CHANGELOG_SEEN_KEY = "pm.changelog.seen";
