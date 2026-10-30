// What a verified provider can change on their own, and what goes back to our
// team first (owner's call, 2026-10-30; build plan D12). Once a profile is
// approved, a change to who they are or what they're licensed for is held as
// "pending": the public profile keeps showing the verified details until an
// admin approves the change (or declines it, with a note). Everything else
// (photo, banner, story, who they work with, expertise, fees, locations in
// states they're already verified in) updates as soon as it's saved.
// Licenses are reviewed per state: an edited license keeps its verified
// version public meanwhile, and a new state (a location plus its license)
// stays off the profile and out of search until its license is verified.

export const REVIEW_FIELDS = ["firstName", "lastName", "titleCredentials", "businessName", "displayAsBusiness", "npiNumber"] as const;
export type ReviewField = (typeof REVIEW_FIELDS)[number];

/** Requested values for reviewed fields, kept on provider_profile.pending_changes. */
export type PendingChanges = Partial<Record<ReviewField, string | boolean>>;

/** A requested edit to a verified license, kept on provider_license.pending. */
export type PendingLicense = { licenseNumber: string; issuingBody: string; documentId: string | null };

// TODO(client): labels (shown to providers and admins).
export const REVIEW_FIELD_LABEL: Record<ReviewField, string> = {
  firstName: "First name",
  lastName: "Last name",
  titleCredentials: "Title",
  businessName: "Business name",
  displayAsBusiness: "Show business name",
  npiNumber: "NPI number",
};

/** Comparable form: missing text is "", a flag is a flag. */
const norm = (value: unknown) => (typeof value === "boolean" ? value : typeof value === "string" ? value.trim() : "");

/** The pending changes after a save: each requested field that differs from
 *  its verified value is held; one set back to its verified value drops out.
 *  Fields not in `requested` keep whatever was already pending. */
export function mergePending(
  verified: Partial<Record<ReviewField, unknown>>,
  pending: PendingChanges | null | undefined,
  requested: Partial<Record<ReviewField, unknown>>,
): PendingChanges {
  const next: PendingChanges = { ...(pending ?? {}) };
  for (const field of REVIEW_FIELDS) {
    if (!(field in requested)) continue;
    const want = norm(requested[field]);
    if (want === norm(verified[field])) delete next[field];
    else next[field] = want;
  }
  return next;
}

export const hasPending = (pending: PendingChanges | null | undefined) => !!pending && Object.keys(pending).length > 0;

/** Same license details (number, board, document)? */
export function sameLicense(a: PendingLicense, b: PendingLicense) {
  return norm(a.licenseNumber) === norm(b.licenseNumber) && norm(a.issuingBody) === norm(b.issuingBody) && (a.documentId ?? null) === (b.documentId ?? null);
}

/** How a reviewed value reads in a list ("—" for none, Yes / No for a flag). */
export function showValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return (typeof value === "string" && value.trim()) || "—";
}
