import "server-only";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { account, user } from "@/db/schema";
import { beforeAccountDeleted } from "@/server/account/cleanup";

// A local-only provider for testing onboarding without a new address each
// time (owner request, 2026-10-29). Every log-in with it deletes the account
// and makes it again, so it always lands on a fresh onboarding welcome.
// Never in production builds. The password is the e2e TEST_PASSWORD.

export const TEST_PROVIDER_EMAIL = "provider@psychmind.test";
const TEST_PROVIDER_PASSWORD = "Calm-Harbor-2026!"; // tests/e2e/fixtures.ts

export const isTestProvider = (email: string) =>
  process.env.NODE_ENV !== "production" && email.trim().toLowerCase() === TEST_PROVIDER_EMAIL;

/** Starts the test provider over: deletes it (files included) and recreates
 *  it verified, with an empty profile. Call only when `isTestProvider`. */
export async function resetTestProvider() {
  if (process.env.NODE_ENV === "production") return;
  await dbReady;
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, TEST_PROVIDER_EMAIL));
  if (existing) {
    await beforeAccountDeleted(existing.id);
    await db.delete(user).where(eq(user.id, existing.id));
  }
  const id = crypto.randomUUID();
  const hash = await hashPassword(TEST_PROVIDER_PASSWORD);
  await db.transaction(async (tx) => {
    await tx
      .insert(user)
      .values({ id, name: "Test Provider", email: TEST_PROVIDER_EMAIL, emailVerified: true, role: "provider", firstName: "Test", lastName: "Provider" });
    await tx.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash });
  });
}
