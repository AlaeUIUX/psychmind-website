import "server-only";
import { hashPassword } from "better-auth/crypto";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { account, providerProfile, savedProvider, sessionRequest, user } from "@/db/schema";
import { beforeAccountDeleted } from "@/server/account/cleanup";

// A local-only patient with a lived-in account: six saved providers and four
// session requests (two answered, two new), so "Saved" and "My requests" can
// be shown without empty states (owner request, 2026-11-05). Every log-in
// rebuilds it with fresh dates. Never in production builds. The password is
// the e2e TEST_PASSWORD. All names and emails are made up (.test addresses).
// The providers are sample profiles; the requests are stored like real ones
// (no "sample provider" note) and are never emailed, since they're inserted here.

export const DEMO_PATIENT_EMAIL = "demo-patient@psychmind.test";
const DEMO_PATIENT_PASSWORD = "Calm-Harbor-2026!"; // tests/e2e/fixtures.ts

export const isDemoPatient = (email: string) =>
  process.env.NODE_ENV !== "production" && email.trim().toLowerCase() === DEMO_PATIENT_EMAIL;

const HOUR = 3_600_000;

/** [hours ago, status, note]: one request each to the first four saved providers. */
const REQUESTS = [
  [12 * 24, "contacted", "Looking for help with anxiety at work and trouble sleeping."],
  [6 * 24, "contacted", null],
  [2 * 24, "new", "Evenings work best for me, online if possible."],
  [5, "new", null],
] as const;

/** Deletes the demo patient and builds it again. Call only when `isDemoPatient`. */
export async function resetDemoPatient() {
  if (process.env.NODE_ENV === "production") return;
  await dbReady;

  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, DEMO_PATIENT_EMAIL));
  if (existing) {
    await beforeAccountDeleted(existing.id);
    await db.delete(user).where(eq(user.id, existing.id)); // saves and requests go with it
  }

  // Listed sample providers in a steady order, skipping the first: the demo
  // provider (Maya Ellison) is built from its profile.
  const providers = (
    await db
      .select({ id: providerProfile.id })
      .from(providerProfile)
      .where(and(eq(providerProfile.isSample, true), isNotNull(providerProfile.approvedAt)))
      .orderBy(asc(providerProfile.createdAt), asc(providerProfile.id))
      .limit(7)
  ).slice(1);

  const first = "Alex";
  const last = "Rivera";
  const id = crypto.randomUUID();
  const hash = await hashPassword(DEMO_PATIENT_PASSWORD);
  const now = Date.now();
  const joined = new Date(now - 30 * 24 * HOUR);

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id,
      name: `${first} ${last}`,
      email: DEMO_PATIENT_EMAIL,
      emailVerified: true,
      role: "patient",
      firstName: first,
      lastName: last,
      ageConfirmedAt: joined,
      createdAt: joined,
    });
    await tx.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash });
    if (!providers.length) return; // the samples were removed: an empty account still logs in

    await tx.insert(savedProvider).values(
      providers.map((p, i) => ({ userId: id, profileId: p.id, createdAt: new Date(now - (14 - i * 2) * 24 * HOUR) })),
    );
    await tx.insert(sessionRequest).values(
      REQUESTS.slice(0, providers.length).map(([hoursAgo, status, note], i) => {
        const createdAt = new Date(now - hoursAgo * HOUR);
        return {
          profileId: providers[i].id,
          patientId: id,
          name: `${first} ${last}`,
          email: DEMO_PATIENT_EMAIL,
          phone: "(305) 555-0142",
          sessionType: "individuals",
          format: i === 1 ? "in_person" : "online",
          note,
          status,
          contactedAt: status === "contacted" ? new Date(createdAt.getTime() + 20 * HOUR) : null,
          createdAt,
        };
      }),
    );
  });
}
