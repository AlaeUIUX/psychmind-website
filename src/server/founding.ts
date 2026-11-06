import "server-only";
import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, dbReady } from "@/db";
import { auditLog, foundingLink, providerProfile } from "@/db/schema";
import { getSession } from "@/server/auth/session";

// Founding providers (owner request, 2026-11-05). The team sends one shared
// link, /founding/{code}. The first `cap` providers who join through it (51)
// are listed free, for good, once the team has verified them: billing never
// applies to them (lib/billing.ts listingState, directory listedCondition).
//
// Opening the link signed out leaves the code in a cookie, so it survives
// email sign-up, its confirmation link and Google; the spot is claimed when
// that provider's profile first loads (ensureProfile). Opened by a signed-in
// provider, it claims at once. A spot, once taken, is never given back.

export const FOUNDING_COOKIE = "pm_founding";
export const FOUNDING_COOKIE_MAX_AGE = 30 * 24 * 3600;

export type FoundingLinkStatus = "open" | "full" | "closed";
export type ClaimResult = "claimed" | "already" | FoundingLinkStatus;

export async function foundingLinkRow() {
  await dbReady;
  const [row] = await db.select().from(foundingLink).where(eq(foundingLink.id, "main"));
  return row ?? null;
}

export async function foundingTaken() {
  await dbReady;
  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(providerProfile).where(isNotNull(providerProfile.foundingAt));
  return n;
}

/** Whether `code` is the current link and has spots left. An old or unknown code reads as closed. */
export async function foundingLinkStatus(code: string | null | undefined): Promise<FoundingLinkStatus> {
  const link = await foundingLinkRow();
  if (!code || !link || !link.active || link.code !== code) return "closed";
  return (await foundingTaken()) < link.cap ? "open" : "full";
}

/** Makes the provider whose profile is `profileId` a founding provider, if the
 *  link is still open. Safe to call again: a founding provider stays one. */
export async function claimFounding(profileId: string, code: string): Promise<ClaimResult> {
  await dbReady;
  return db.transaction(async (tx) => {
    const [profile] = await tx
      .select({ foundingAt: providerProfile.foundingAt, userId: providerProfile.userId })
      .from(providerProfile)
      .where(eq(providerProfile.id, profileId));
    if (!profile) return "closed";
    if (profile.foundingAt) return "already";
    // Lock the link row so two sign-ups can't take the last spot together.
    const [link] = await tx.select().from(foundingLink).where(eq(foundingLink.id, "main")).for("update");
    if (!link || !link.active || link.code !== code) return "closed";
    const [{ n } = { n: 0 }] = await tx.select({ n: count() }).from(providerProfile).where(isNotNull(providerProfile.foundingAt));
    if (n >= link.cap) return "full";
    const updated = await tx
      .update(providerProfile)
      .set({ foundingAt: new Date() })
      .where(and(eq(providerProfile.id, profileId), isNull(providerProfile.foundingAt)))
      .returning({ id: providerProfile.id });
    if (!updated.length) return "already";
    await tx.insert(auditLog).values({
      actorId: profile.userId,
      action: "provider.founding_joined",
      targetType: "provider_profile",
      targetId: profileId,
      meta: { spot: n + 1, cap: link.cap },
    });
    return "claimed";
  });
}

/** Claims a founding spot for the signed-in provider when they opened the link
 *  before signing up (the cookie). Quietly does nothing outside a request, for
 *  anyone else's profile, or when there's no cookie. */
export async function claimFoundingFromCookie(userId: string, profileId: string) {
  let code: string | undefined;
  try {
    code = (await cookies()).get(FOUNDING_COOKIE)?.value;
  } catch {
    return false; // not in a request (cron, scripts)
  }
  if (!code) return false;
  const session = await getSession();
  if (session?.user.id !== userId || session.user.role !== "provider") return false;
  return (await claimFounding(profileId, code)) === "claimed";
}
