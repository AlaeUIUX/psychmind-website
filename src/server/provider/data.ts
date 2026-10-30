import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { providerLicense, providerLocation, providerProfile, subscription, upload, user } from "@/db/schema";
import type { BillingSnapshot, SubscriptionStatus } from "@/lib/billing";
import { REVIEW_FIELD_LABEL, REVIEW_FIELDS, showValue, type PendingChanges } from "@/lib/provider/review";
import type { ProviderState, UploadMeta } from "@/lib/provider/state";

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
  const uploadIds = [p.photoId, p.bannerId, ...licenses.flatMap((l) => [l.documentId, l.pending?.documentId])].filter(Boolean) as string[];
  const uploads = uploadIds.length ? await db.select().from(upload).where(inArray(upload.id, uploadIds)) : [];
  const byId = new Map(uploads.map((u) => [u.id, toMeta(u)]));
  const meta = (id: string | null | undefined) => (id ? (byId.get(id) ?? null) : null);

  // A verified profile's requested changes show in its own state (the editor,
  // previews, the admin's review); the public directory reads the columns.
  const live = p.status === "approved";
  const pending: PendingChanges = live ? (p.pendingChanges ?? {}) : {};
  const want = <T,>(field: keyof PendingChanges, verified: T): T => (field in pending ? (pending[field] as T) : verified);
  const verifiedValues = {
    firstName: p.firstName,
    lastName: p.lastName,
    titleCredentials: p.titleCredentials,
    businessName: p.businessName ?? "",
    displayAsBusiness: p.displayAsBusiness,
    npiNumber: p.npiNumber ?? "",
  };
  const inReview = REVIEW_FIELDS.filter((f) => f in pending).map((field) => ({
    field,
    label: REVIEW_FIELD_LABEL[field],
    verified: showValue(verifiedValues[field]),
    requested: showValue(pending[field]),
  }));

  return {
    id: p.id,
    publicId: p.publicId,
    isSample: p.isSample,
    externalPhotoUrl: p.externalPhotoUrl,
    requestEmail: p.requestEmail,
    status: p.status,
    onboardingStep: p.onboardingStep,
    reviewNote: p.reviewNote,
    needsReview: p.needsReview,
    inReview,
    extraLocations: p.extraLocations,
    firstName: want("firstName", verifiedValues.firstName),
    lastName: want("lastName", verifiedValues.lastName),
    businessName: want("businessName", verifiedValues.businessName),
    displayAsBusiness: want("displayAsBusiness", verifiedValues.displayAsBusiness),
    titleCredentials: want("titleCredentials", verifiedValues.titleCredentials),
    pronouns: p.pronouns ?? "",
    photo: meta(p.photoId),
    banner: meta(p.bannerId),
    useDefaultBanner: p.useDefaultBanner,
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
    npiNumber: want("npiNumber", verifiedValues.npiNumber),
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
    licenses: licenses.map((l) => {
      const edit = live ? l.pending : null;
      return {
        id: l.id,
        state: l.state,
        licenseNumber: edit?.licenseNumber ?? l.licenseNumber,
        issuingBody: edit?.issuingBody ?? l.issuingBody,
        status: edit ? ("pending" as const) : l.status,
        document: meta(edit ? edit.documentId : l.documentId),
        review: edit ? ("update" as const) : live && l.status === "pending" ? ("new" as const) : null,
        verified: edit ? { licenseNumber: l.licenseNumber, issuingBody: l.issuingBody, document: meta(l.documentId) } : null,
      };
    }),
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
