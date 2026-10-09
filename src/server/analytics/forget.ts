import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { analyticsDaily, analyticsTerm } from "@/db/schema";

/** Removes a provider's analytics (their account was deleted, or they were a sample). */
export async function forgetProviderAnalytics(profileIds: string[]) {
  if (!profileIds.length) return;
  await db.delete(analyticsDaily).where(inArray(analyticsDaily.profileId, profileIds));
  await db.delete(analyticsTerm).where(inArray(analyticsTerm.profileId, profileIds));
}
