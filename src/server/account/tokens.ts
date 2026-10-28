import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { verification } from "@/db/schema";

// One-time links (changing your email, confirming a blog subscription) in Better
// Auth's `verification` table.
// Only a hash of the token is stored, so a database leak can't be replayed.

export type TokenPurpose = "email-change-start" | "email-change-confirm" | "blog-subscribe";

const hash = (token: string) => createHash("sha256").update(token).digest("base64url");
const identifier = (purpose: TokenPurpose, token: string) => `${purpose}:${hash(token)}`;

/** A new token for `purpose`, valid for `ttlSeconds`. Replaces any earlier
 *  token for the same `owner` so only the newest link works. */
export async function issueToken(purpose: TokenPurpose, owner: string, value: string, ttlSeconds: number) {
  await dbReady;
  const token = randomBytes(32).toString("base64url");
  // A pointer row per owner names their newest token, so issuing a new one
  // can delete the old one without scanning.
  const pointer = `${purpose}-owner:${owner}`;
  await db.transaction(async (tx) => {
    const earlier = await tx.delete(verification).where(eq(verification.identifier, pointer)).returning({ value: verification.value });
    for (const row of earlier) await tx.delete(verification).where(eq(verification.identifier, row.value));
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const id = identifier(purpose, token);
    await tx.insert(verification).values({ id: crypto.randomUUID(), identifier: id, value, expiresAt });
    await tx.insert(verification).values({ id: crypto.randomUUID(), identifier: pointer, value: id, expiresAt });
  });
  return token;
}

/** The value stored with a token, or null if it's unknown or expired. */
export async function readToken(purpose: TokenPurpose, token: string | undefined | null) {
  if (!token || token.length > 200) return null;
  await dbReady;
  const [row] = await db
    .select({ value: verification.value })
    .from(verification)
    .where(and(eq(verification.identifier, identifier(purpose, token)), gt(verification.expiresAt, new Date())));
  return row?.value ?? null;
}

/** Uses a token up. Returns its value, or null if it was already used or expired
 *  (so two clicks can't both succeed). */
export async function consumeToken(purpose: TokenPurpose, token: string | undefined | null) {
  if (!token || token.length > 200) return null;
  await dbReady;
  const [row] = await db
    .delete(verification)
    .where(and(eq(verification.identifier, identifier(purpose, token)), gt(verification.expiresAt, new Date())))
    .returning({ value: verification.value });
  return row?.value ?? null;
}
