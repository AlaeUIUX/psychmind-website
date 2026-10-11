import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

// "Send this once, ever" without a table of its own: the audit log records
// each automatic email, and a new one is only sent when no row matches.
// A transaction-scoped advisory lock on the target makes check-then-insert
// safe when two webhooks (or a webhook and the cron) arrive together.

type Claim = { action: string; targetType: string; targetId: string; meta: Record<string, string | number> };

/** Records the claim and returns its id, or null when it was already made. */
export async function claimOnce({ action, targetType, targetId, meta }: Claim): Promise<string | null> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${action}:${targetType}:${targetId}`}))`);
    const [existing] = await tx
      .select({ id: auditLog.id })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.action, action),
          eq(auditLog.targetType, targetType),
          eq(auditLog.targetId, targetId),
          sql`${auditLog.meta} @> ${JSON.stringify(meta)}::jsonb`,
        ),
      )
      .limit(1);
    if (existing) return null;
    const [row] = await tx
      .insert(auditLog)
      .values({ actorId: null, action, targetType, targetId, meta })
      .returning({ id: auditLog.id });
    return row.id;
  });
}

/** Gives a claim back (the email didn't go out), so a later run retries. */
export async function releaseClaim(id: string) {
  await db.delete(auditLog).where(eq(auditLog.id, id));
}

/** Claims, runs `send`, and releases the claim if sending fails. True when sent now. */
export async function doOnce(claim: Claim, send: () => Promise<void>): Promise<boolean> {
  const id = await claimOnce(claim);
  if (!id) return false;
  try {
    await send();
    return true;
  } catch (err) {
    await releaseClaim(id).catch(() => {});
    throw err;
  }
}
