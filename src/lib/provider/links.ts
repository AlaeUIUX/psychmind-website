// Public profile links: /providers/{name-slug}-{publicId}. The name part is
// for people and search engines; the 8-character id at the end is what's
// looked up, so links keep working if the name changes.

type Named = {
  publicId?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string | null;
  displayAsBusiness?: boolean;
};

const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function profileSlug(p: Named) {
  const name = p.displayAsBusiness && p.businessName ? p.businessName : `${p.firstName ?? ""} ${p.lastName ?? ""}`;
  return slugify(name);
}

export function profilePath(p: Named & { publicId: string }) {
  const slug = profileSlug(p);
  return `/providers/${slug ? `${slug}-` : ""}${p.publicId}`;
}

/** A path segment as text ("%E9" and other broken escapes stay as they are). */
export function decodeSegment(ref: string) {
  try {
    return decodeURIComponent(ref);
  } catch {
    return ref;
  }
}

/** The public id at the end of a profile link segment, or null. */
export function parseProfileRef(ref: string): string | null {
  const id = decodeSegment(ref).split("-").pop() ?? "";
  return /^[a-z0-9]{8}$/.test(id) ? id : null;
}
