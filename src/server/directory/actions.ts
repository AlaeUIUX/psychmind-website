"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, dbReady } from "@/db";
import { savedProvider } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/server/auth/session";
import { track } from "@/server/analytics/track";
import { isListedProvider } from "./data";

// The heart on provider cards and profiles. Saving is for patient accounts;
// anyone else gets a reason back so the button can prompt them.

export type SaveResult = { ok: true; saved: boolean } | { ok: false; reason: "auth" | "role" | "missing" | "rate" };

export async function setProviderSaved(profileId: string, saved: boolean): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "auth" };
  if (session.user.role !== "patient") return { ok: false, reason: "role" };
  if (typeof profileId !== "string" || profileId.length > 64 || typeof saved !== "boolean") return { ok: false, reason: "missing" };
  if (!(await rateLimit("save-provider", session.user.id, 60, "1 m")).ok) return { ok: false, reason: "rate" };
  await dbReady;

  if (saved) {
    if (!(await isListedProvider(profileId))) return { ok: false, reason: "missing" };
    const added = await db.insert(savedProvider).values({ userId: session.user.id, profileId }).onConflictDoNothing().returning({ id: savedProvider.profileId });
    if (added.length) track("save", profileId);
  } else {
    await db.delete(savedProvider).where(and(eq(savedProvider.userId, session.user.id), eq(savedProvider.profileId, profileId)));
  }
  revalidatePath("/account");
  return { ok: true, saved };
}
