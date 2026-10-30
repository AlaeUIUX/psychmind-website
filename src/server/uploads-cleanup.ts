import "server-only";
import { and, eq, isNotNull, lt, notInArray, sql } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { providerLicense, providerProfile, upload } from "@/db/schema";
import { deleteFile } from "@/server/storage";

// Uploads that were never saved to a profile (a photo picked, then the step
// abandoned or another photo chosen before saving): after a day, the bytes
// and the row go. Saved files are referenced by provider_profile.photo_id,
// provider_profile.banner_id, provider_license.document_id, or a license edit
// waiting for review (provider_license.pending). Run by the daily cron.

const MAX_AGE_MS = 24 * 3_600_000;
const BATCH = 200;

export async function cleanUpUnsavedUploads(now = new Date()) {
  await dbReady;
  const photos = db.select({ id: providerProfile.photoId }).from(providerProfile).where(isNotNull(providerProfile.photoId));
  const banners = db.select({ id: providerProfile.bannerId }).from(providerProfile).where(isNotNull(providerProfile.bannerId));
  const documents = db.select({ id: providerLicense.documentId }).from(providerLicense).where(isNotNull(providerLicense.documentId));
  const inReview = db
    .select({ id: sql<string>`${providerLicense.pending} ->> 'documentId'` })
    .from(providerLicense)
    // never a null in a NOT IN list: it would match nothing
    .where(sql`${providerLicense.pending} ->> 'documentId' is not null`);
  const stale = await db
    .select({ id: upload.id, storageKey: upload.storageKey })
    .from(upload)
    .where(
      and(
        lt(upload.createdAt, new Date(now.getTime() - MAX_AGE_MS)),
        notInArray(upload.id, photos),
        notInArray(upload.id, banners),
        notInArray(upload.id, documents),
        notInArray(upload.id, inReview),
      ),
    )
    .limit(BATCH);

  let deleted = 0;
  let failed = 0;
  for (const file of stale) {
    try {
      // The row first, checking again that nothing saved it meanwhile; then the bytes.
      const [gone] = await db
        .delete(upload)
        .where(and(eq(upload.id, file.id), notInArray(upload.id, photos), notInArray(upload.id, banners), notInArray(upload.id, documents), notInArray(upload.id, inReview)))
        .returning({ id: upload.id });
      if (!gone) continue;
      await deleteFile(file.storageKey);
      deleted++;
    } catch (err) {
      failed++;
      console.error("upload cleanup failed", file.id, err);
    }
  }
  return { deleted, failed };
}
