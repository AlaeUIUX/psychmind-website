import "server-only";
import { and, asc, desc, eq, exists, gt, inArray, isNotNull, not, or, sql } from "drizzle-orm";
import { cache } from "react";
import { db, dbReady } from "@/db";
import { providerLicense, providerLocation, providerProfile, savedProvider, subscription } from "@/db/schema";
import { stripeConfigured } from "@/lib/billing";
import { profilePath } from "@/lib/provider/links";
import { fileUrl } from "@/lib/provider/state";
import type { ProfileView } from "@/lib/provider/types";
import { selfHosted } from "@/lib/photos";

// The public directory: who appears in search and on public profile pages,
// and only what's meant to be public (no email, NPI or private addresses).

export type DirectoryProvider = ProfileView & {
  id: string;
  publicId: string;
  href: string;
};

/** Listed = approved and, once billing is connected, paying (or in the
 *  3-day grace period after a failed renewal). Until Stripe is set up,
 *  approval alone lists a provider so verification can be tried end to end
 *  (unless a subscription record says their payments lapsed).
 *  Sample and founding providers (server/founding.ts) are listed once approved, without paying. */
export function listedCondition() {
  const approved = eq(providerProfile.status, "approved");
  const free = or(eq(providerProfile.isSample, true), isNotNull(providerProfile.foundingAt));
  if (!stripeConfigured()) {
    // Without Stripe, approval lists a provider, unless a subscription record
    // says their payments lapsed (still past due after the grace period):
    // the same "paused" their dashboard shows them (lib/billing listingState).
    const lapsed = exists(
      db
        .select({ one: sql`1` })
        .from(subscription)
        .where(
          and(
            eq(subscription.referenceId, providerProfile.userId),
            or(
              inArray(subscription.status, ["unpaid", "paused"]),
              and(eq(subscription.status, "past_due"), sql`coalesce(${providerProfile.pastDueSince}, now()) <= now() - interval '3 days'`),
            ),
          ),
        ),
    );
    return and(approved, or(free, not(lapsed)));
  }
  const paying = exists(
    db
      .select({ one: sql`1` })
      .from(subscription)
      .where(
        and(
          eq(subscription.referenceId, providerProfile.userId),
          or(
            inArray(subscription.status, ["active", "trialing"]),
            and(eq(subscription.status, "past_due"), gt(providerProfile.pastDueSince, sql`now() - interval '3 days'`)),
          ),
        ),
      ),
  );
  return and(approved, or(free, paying));
}

type ProfileRow = typeof providerProfile.$inferSelect;

async function hydrate(rows: ProfileRow[]): Promise<DirectoryProvider[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [locations, licenses] = await Promise.all([
    db.select().from(providerLocation).where(inArray(providerLocation.profileId, ids)).orderBy(asc(providerLocation.sortOrder)),
    db
      .select()
      .from(providerLicense)
      .where(and(inArray(providerLicense.profileId, ids), eq(providerLicense.status, "verified"))),
  ]);
  return rows.map((p) => {
    const own = licenses.filter((l) => l.profileId === p.id);
    // A practice shows only in states the provider holds a verified license in:
    // a new state stays off the profile and out of search until our team checks it.
    const verifiedStates = new Set(own.map((l) => l.state));
    const view: DirectoryProvider = {
      id: p.id,
      publicId: p.publicId,
      href: profilePath({ ...p, businessName: p.businessName }),
      isSample: p.isSample,
      firstName: p.firstName,
      lastName: p.lastName,
      businessName: p.businessName,
      displayAsBusiness: p.displayAsBusiness,
      titleCredentials: p.titleCredentials,
      pronouns: p.pronouns,
      photoUrl: p.externalPhotoUrl ? selfHosted(p.externalPhotoUrl) : (p.photoId ? fileUrl(p.photoId) : null),
      bannerUrl: p.bannerId && !p.useDefaultBanner ? fileUrl(p.bannerId) : null,
      verified: true,
      whoYouWorkWith: p.whoYouWorkWith,
      about: p.about,
      sessionParticipants: p.sessionParticipants,
      ageGroups: p.ageGroups,
      specialties: p.specialties,
      primarySpecialty: p.primarySpecialty,
      approaches: p.approaches,
      languages: p.languages,
      // For the "Provider gender" filter.
      gender: p.gender,
      feeIndividual: p.feeIndividual,
      feeCouples: p.feeCouples,
      slidingScale: p.slidingScale,
      insurance: p.insurance,
      acceptingNewClients: p.acceptingNewClients,
      education: p.education,
      yearsExperience: p.yearsExperience,
      licenses: own.map((l) => ({ state: l.state, licenseNumber: l.licenseNumber, issuingBody: l.issuingBody, verified: true })),
      locations: locations
        .filter((l) => l.profileId === p.id && (p.isSample || verifiedStates.has(l.state)))
        .map((l) => ({
          state: l.state,
          city: l.city,
          zip: l.zip ?? undefined,
          formats: l.formats,
          isPrimary: l.isPrimary,
          practiceName: l.practiceName ?? undefined,
          // Street addresses are private unless clients visit in person.
          address: l.formats.includes("in_person") ? (l.address ?? undefined) : undefined,
        })),
    };
    return view;
  });
}

/** Everyone listed right now: real providers first, then by most recently
 *  approved. Cached per request (the page and its metadata share it). */
export const listDirectory = cache(async (): Promise<DirectoryProvider[]> => {
  await dbReady;
  const rows = await db
    .select()
    .from(providerProfile)
    .where(listedCondition())
    .orderBy(asc(providerProfile.isSample), desc(providerProfile.approvedAt));
  return hydrate(rows);
});

/** One listed provider by the public id in their profile link (cached per request). */
export const getDirectoryProvider = cache(async (publicId: string): Promise<DirectoryProvider | null> => {
  await dbReady;
  const rows = await db
    .select()
    .from(providerProfile)
    .where(and(eq(providerProfile.publicId, publicId), listedCondition()));
  return (await hydrate(rows))[0] ?? null;
});

/** Whether a provider (by profile id) is in the directory right now. */
export async function isListedProvider(profileId: string): Promise<boolean> {
  await dbReady;
  const rows = await db
    .select({ id: providerProfile.id })
    .from(providerProfile)
    .where(and(eq(providerProfile.id, profileId), listedCondition()));
  return rows.length > 0;
}

/** Whether this patient has saved this provider. */
export async function isProviderSaved(userId: string, profileId: string): Promise<boolean> {
  await dbReady;
  const rows = await db
    .select({ id: savedProvider.profileId })
    .from(savedProvider)
    .where(and(eq(savedProvider.userId, userId), eq(savedProvider.profileId, profileId)));
  return rows.length > 0;
}

/** Profile ids this patient has saved. */
export async function savedProfileIds(userId: string): Promise<string[]> {
  await dbReady;
  const rows = await db.select({ id: savedProvider.profileId }).from(savedProvider).where(eq(savedProvider.userId, userId));
  return rows.map((r) => r.id);
}

/** A provider who was listed once but isn't now (paused, unpaid, suspended,
 *  or taking a break): only who they are, nothing else from the profile, and
 *  no photo, which is only served while they're listed. */
export type UnavailableProvider = Pick<
  DirectoryProvider,
  "id" | "publicId" | "href" | "isSample" | "firstName" | "lastName" | "businessName" | "displayAsBusiness" | "titleCredentials" | "pronouns" | "photoUrl"
>;

function unavailable(p: ProfileRow): UnavailableProvider {
  return {
    id: p.id,
    publicId: p.publicId,
    href: profilePath({ ...p, businessName: p.businessName }),
    isSample: p.isSample,
    firstName: p.firstName,
    lastName: p.lastName,
    businessName: p.businessName,
    displayAsBusiness: p.displayAsBusiness,
    titleCredentials: p.titleCredentials,
    pronouns: p.pronouns,
    photoUrl: null,
  };
}

export type SavedEntry = { available: true; p: DirectoryProvider } | { available: false; p: UnavailableProvider };

/** The patient's saved providers, newest first. Those who've left the
 *  directory stay on the list, marked unavailable, so the patient can still
 *  find them (and unsave them); they come back by themselves when listed again. */
export async function savedProviders(userId: string): Promise<SavedEntry[]> {
  await dbReady;
  const rows = await db
    .select({ profile: providerProfile, listed: sql<boolean>`coalesce((${listedCondition()}), false)` })
    .from(savedProvider)
    .innerJoin(providerProfile, eq(providerProfile.id, savedProvider.profileId))
    .where(eq(savedProvider.userId, userId))
    .orderBy(desc(savedProvider.createdAt));
  const listed = new Map((await hydrate(rows.filter((r) => r.listed).map((r) => r.profile))).map((p) => [p.id, p]));
  return rows.map(({ profile }): SavedEntry => {
    const p = listed.get(profile.id);
    return p ? { available: true, p } : { available: false, p: unavailable(profile) };
  });
}

/** A profile link to someone who was listed before but isn't now: the
 *  profile page says they're unavailable instead of "not found". Never for
 *  a profile that was never approved, so drafts stay invisible. */
export async function getUnavailableProvider(publicId: string): Promise<UnavailableProvider | null> {
  await dbReady;
  const [row] = await db
    .select()
    .from(providerProfile)
    .where(and(eq(providerProfile.publicId, publicId), isNotNull(providerProfile.approvedAt)));
  return row ? unavailable(row) : null;
}
