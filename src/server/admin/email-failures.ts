import "server-only";
import { and, count, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { emailFailure, user } from "@/db/schema";
import { requireRole } from "@/server/auth/session";

// Admin → Failed emails: what server/email.ts couldn't send.

export async function listEmailFailures(view: "open" | "handled") {
  await requireRole("admin", "/admin/emails");
  await dbReady;
  return db
    .select({
      id: emailFailure.id,
      recipient: emailFailure.recipient,
      subject: emailFailure.subject,
      error: emailFailure.error,
      createdAt: emailFailure.createdAt,
      handledAt: emailFailure.handledAt,
      handledBy: user.name,
    })
    .from(emailFailure)
    .leftJoin(user, eq(user.id, emailFailure.handledById))
    .where(view === "open" ? isNull(emailFailure.handledAt) : isNotNull(emailFailure.handledAt))
    .orderBy(desc(emailFailure.createdAt))
    .limit(200);
}

export async function countOpenEmailFailures() {
  await requireRole("admin", "/admin/emails");
  await dbReady;
  const [row] = await db.select({ n: count() }).from(emailFailure).where(isNull(emailFailure.handledAt));
  return row?.n ?? 0;
}

/** Marks one failure (or every open one) as handled. */
export async function markEmailFailuresHandled(adminId: string, id?: string) {
  await requireRole("admin", "/admin/emails");
  await dbReady;
  await db
    .update(emailFailure)
    .set({ handledAt: new Date(), handledById: adminId })
    .where(id ? and(eq(emailFailure.id, id), isNull(emailFailure.handledAt)) : isNull(emailFailure.handledAt));
}

/** The daily job: failures are kept 90 days. */
export async function pruneEmailFailures(now = new Date()) {
  await dbReady;
  const cutoff = new Date(now.getTime() - 90 * 86_400_000);
  const removed = await db.delete(emailFailure).where(lt(emailFailure.createdAt, cutoff)).returning({ id: emailFailure.id });
  return { removed: removed.length };
}
