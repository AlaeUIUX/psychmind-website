import "server-only";
import { and, asc, desc, eq, exists, gt, inArray, or, sql } from "drizzle-orm";
import { cache } from "react";
import { db, dbReady } from "@/db";
import { providerLicense, providerLocation, providerProfile, savedProvider, subscription } from "@/db/schema";
import { stripeConfigured } from "@/lib/billing";
import { profilePath } from "@/lib/provider/links";
import { fileUrl } from "@/lib/provider/state";
import type { ProfileView } from "@/lib/provider/types";
import type { BannerStyle } from "@/lib/taxonomy";

// The public directory: who appears in search and on public profile pages,
// and only what's meant to be public (no email, NPI or private addresses).

export type DirectoryProvider = ProfileView & {
  id: string;
  publicId: string;
  href: string;
};

/** Listed = approved and, once billing is connected, paying (or in the
 *  3-day grace period after a failed renewal). Until Stripe is set up,
 *  approval alone lists a provider so verification can be tried end to end.
 *  Sample providers are always listed. */
function listedCondition() {
  const approved = eq(providerProfile.status, "approved");
  if (!stripeConfigured()) return approved;
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
  return and(approved, or(eq(providerProfile.isSample, true), paying));
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
      bannerStyle: p.bannerStyle as BannerStyle,
      photoUrl: p.externalPhotoUrl ?? (p.photoId ? fileUrl(p.photoId) : null),
      verified: true,
      whoYouWorkWith: p.whoYouWorkWith,
      about: p.about,
      sessionParticipants: p.sessionParticipants,
      ageGroups: p.ageGroups,
      specialties: p.specialties,
      primarySpecialty: p.primarySpecialty,
      approaches: p.approaches,
      languages: p.languages,
      feeIndividual: p.feeIndividual,
      feeCouples: p.feeCouples,
      slidingScale: p.slidingScale,
      acceptingNewClients: p.acceptingNewClients,
      education: p.education,
      yearsExperience: p.yearsExperience,
      licenses: licenses
        .filter((l) => l.profileId === p.id)
        .map((l) => ({ state: l.state, licenseNumber: l.licenseNumber, issuingBody: l.issuingBody, verified: true })),
      locations: locations
        .filter((l) => l.profileId === p.id)
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

/** The patient's saved providers that are still listed, newest first. */
export async function savedProviders(userId: string): Promise<DirectoryProvider[]> {
  await dbReady;
  const rows = await db
    .select({ profile: providerProfile })
    .from(savedProvider)
    .innerJoin(providerProfile, eq(providerProfile.id, savedProvider.profileId))
    .where(and(eq(savedProvider.userId, userId), listedCondition()))
    .orderBy(desc(savedProvider.createdAt));
  return hydrate(rows.map((r) => r.profile));
}
