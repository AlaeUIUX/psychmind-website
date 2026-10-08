import "server-only";
import { and, eq } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { account } from "@/db/schema";

/** Whether this account can log in with a password (vs. Google only). */
export async function hasPasswordLogin(userId: string) {
  await dbReady;
  const rows = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")));
  return rows.length > 0;
}
