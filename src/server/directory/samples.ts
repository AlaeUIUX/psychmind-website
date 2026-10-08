import "server-only";
import { and, count, eq, like } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { auditLog, providerLicense, providerLocation, providerProfile, user } from "@/db/schema";
import { SAMPLE_PROVIDERS } from "./sample-data";
import { SAMPLE_DOMAIN, sampleEmail, sampleRows } from "./sample-rows";

// Adds or removes the 50 sample providers (Admin → Sample providers). Each is
// a provider account that can't log in (no password, and the .test domain
// can't receive mail), with an approved profile, verified licenses for every
// state they practice in, and is_sample set so they're labelled everywhere
// and can't be booked. Removing deletes the accounts; everything attached
// goes with them. A fresh database gets them from migration 0007.

export async function sampleCount() {
  await dbReady;
  const [row] = await db.select({ n: count() }).from(providerProfile).where(eq(providerProfile.isSample, true));
  return row?.n ?? 0;
}

/** Creates the sample providers that don't exist yet. Returns how many were added. */
export async function addSampleProviders(adminId: string) {
  await dbReady;
  const existing = new Set(
    (await db.select({ email: user.email }).from(user).where(like(user.email, `%@${SAMPLE_DOMAIN}`))).map((u) => u.email),
  );
  let added = 0;
  const now = Date.now();

  for (const [i, s] of SAMPLE_PROVIDERS.entries()) {
    if (existing.has(sampleEmail(i))) continue;
    const rows = sampleRows(s, i);
    const approvedAt = new Date(now - rows.approvedDaysAgo * 86_400_000);

    const created = await db.transaction(async (tx) => {
      const [u] = await tx
        .insert(user)
        .values({ id: crypto.randomUUID(), ...rows.user })
        // Another admin (or a second click) added this one meanwhile.
        .onConflictDoNothing({ target: user.email })
        .returning({ id: user.id });
      if (!u) return false;
      const [profile] = await tx
        .insert(providerProfile)
        .values({ userId: u.id, ...rows.profile, submittedAt: new Date(approvedAt.getTime() - 2 * 86_400_000), approvedAt })
        .returning({ id: providerProfile.id });
      await tx.insert(providerLocation).values(rows.locations.map((l) => ({ profileId: profile.id, ...l })));
      await tx.insert(providerLicense).values(rows.licenses.map((l) => ({ profileId: profile.id, ...l })));
      return true;
    });
    if (created) added++;
  }

  if (added) {
    await db.insert(auditLog).values({ actorId: adminId, action: "samples.added", targetType: "directory", targetId: "samples", meta: { added } });
  }
  return added;
}

/** Deletes every sample provider. Returns how many were removed. */
export async function removeSampleProviders(adminId: string) {
  await dbReady;
  const removed = await db
    .delete(user)
    .where(and(like(user.email, `%@${SAMPLE_DOMAIN}`), eq(user.role, "provider")))
    .returning({ id: user.id });
  if (removed.length) {
    await db.insert(auditLog).values({
      actorId: adminId,
      action: "samples.removed",
      targetType: "directory",
      targetId: "samples",
      meta: { removed: removed.length },
    });
  }
  return removed.length;
}
