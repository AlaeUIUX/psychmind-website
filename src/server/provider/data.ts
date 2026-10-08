import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { providerLicense, providerLocation, providerProfile, subscription, upload, user } from "@/db/schema";
import type { BillingSnapshot, SubscriptionStatus } from "@/lib/billing";
import type { ProviderState, UploadMeta } from "@/lib/provider/state";
import type { BannerStyle } from "@/lib/taxonomy";

// Reads for the provider area. Callers must already have checked who's
// asking (see src/server/auth/session.ts); these functions take a user id.

const toMeta = (u: typeof upload.$inferSelect): UploadMeta => ({
  id: u.id,
  fileName: u.fileName,
  size: u.size,
  mimeType: u.mimeType,
});

/** Get the provider's profile row, creating an empty one on first visit. */
export async function ensureProfile(userId: string) {
  await dbReady;
  const [existing] = await db.select().from(providerProfile).where(eq(providerProfile.userId, userId));
  if (existing) return existing;
  const [owner] = await db.select({ firstName: user.firstName, lastName: user.lastName }).from(user).where(eq(user.id, userId));
  const [created] = await db
    .insert(providerProfile)
    .values({ userId, firstName: owner?.firstName ?? "", lastName: owner?.lastName ?? "" })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.select().from(providerProfile).where(eq(providerProfile.userId, userId)))[0];
}

export async function loadProviderState(userId: string): Promise<ProviderState> {
  const p = await ensureProfile(userId);
  return buildState(p);
}

export async function loadProviderStateById(profileId: string): Promise<ProviderState | null> {
  await dbReady;
  const [p] = await db.select().from(providerProfile).where(eq(providerProfile.id, profileId));
  return p ? buildState(p) : null;
}

async function buildState(p: typeof providerProfile.$inferSelect): Promise<ProviderState> {
  const [locations, licenses] = await Promise.all([
    db.select().from(providerLocation).where(eq(providerLocation.profileId, p.id)).orderBy(asc(providerLocation.sortOrder)),
    db.select().from(providerLicense).where(eq(providerLicense.profileId, p.id)),
  ]);
  const uploadIds = [p.photoId, ...licenses.map((l) => l.documentId)].filter(Boolean) as string[];
  const uploads = uploadIds.length ? await db.select().from(upload).where(inArray(upload.id, uploadIds)) : [];
  const byId = new Map(uploads.map((u) => [u.id, toMeta(u)]));

  return {
    id: p.id,
    status: p.status,
    onboardingStep: p.onboardingStep,
    reviewNote: p.reviewNote,
    needsReview: p.needsReview,
    extraLocations: p.extraLocations,
    firstName: p.firstName,
    lastName: p.lastName,
    businessName: p.businessName ?? "",
    displayAsBusiness: p.displayAsBusiness,
    titleCredentials: p.titleCredentials,
    pronouns: p.pronouns ?? "",
    bannerStyle: p.bannerStyle as BannerStyle,
    photo: p.photoId ? (byId.get(p.photoId) ?? null) : null,
    whoYouWorkWith: p.whoYouWorkWith,
    about: p.about,
    sessionParticipants: p.sessionParticipants,
    ageGroups: p.ageGroups,
    specialties: p.specialties,
    primarySpecialty: p.primarySpecialty ?? "",
    approaches: p.approaches,
    languages: p.languages,
    gender: p.gender ?? "",
    feeIndividual: p.feeIndividual,
    feeCouples: p.feeCouples,
    slidingScale: p.slidingScale,
    acceptingNewClients: p.acceptingNewClients,
    education: p.education,
    npiNumber: p.npiNumber ?? "",
    yearsExperience: p.yearsExperience,
    locations: locations.map((l) => ({
      id: l.id,
      state: l.state,
      city: l.city,
      zip: l.zip ?? "",
      practiceName: l.practiceName ?? "",
      address: l.address ?? "",
      formats: l.formats,
      isPrimary: l.isPrimary,
    })),
    licenses: licenses.map((l) => ({
      id: l.id,
      state: l.state,
      licenseNumber: l.licenseNumber,
      issuingBody: l.issuingBody,
      status: l.status,
      document: l.documentId ? (byId.get(l.documentId) ?? null) : null,
    })),
  };
}

/** The provider's current subscription, as the listing rules need it. */
export async function loadBilling(userId: string, pastDueSince: Date | null): Promise<BillingSnapshot & { plan: string | null }> {
  await dbReady;
  const subs = await db.select().from(subscription).where(eq(subscription.referenceId, userId));
  // Prefer a live subscription over old canceled ones.
  const rank = (s: string | null) => ["active", "trialing", "past_due", "unpaid", "paused"].indexOf(s ?? "");
  const sub = subs.sort((a, b) => (rank(a.status) === -1 ? 99 : rank(a.status)) - (rank(b.status) === -1 ? 99 : rank(b.status)))[0];
  return {
    plan: sub?.plan ?? null,
    status: (sub?.status as SubscriptionStatus | null) ?? null,
    pastDueSince,
    periodEnd: sub?.periodEnd ?? null,
    cancelAtPeriodEnd: !!sub?.cancelAtPeriodEnd,
  };
}
