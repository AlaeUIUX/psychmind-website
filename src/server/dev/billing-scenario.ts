import "server-only";
import { hashPassword } from "better-auth/crypto";
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { account, providerLicense, providerLocation, providerProfile, savedProvider, subscription, user } from "@/db/schema";
import { stripeConfigured } from "@/lib/billing";
import { profilePath } from "@/lib/provider/links";
import { beforeAccountDeleted } from "@/server/account/cleanup";

// Local-only walk-through of a provider whose payments lapse (owner request,
// 2026-11-09): Jordan Hale, a real (not sample) approved provider with a
// subscription, and Sam Carter, a patient who saved Jordan. The dev page
// /dev/billing-scenario moves Jordan through three stages:
//   active   paying, listed
//   failed   the invoice failed today: past due, still listed (3-day grace)
//   lapsed   still unpaid after the grace period: unlisted, so Sam sees
//            "Currently unavailable" and the profile link says so too
// The subscription row is written here, not by Stripe. Never in production.

export const SCENARIO_PROVIDER_EMAIL = "demo-lapsed-provider@psychmind.test";
export const SCENARIO_PATIENT_EMAIL = "demo-saver@psychmind.test";
const PASSWORD = "Calm-Harbor-2026!"; // the e2e TEST_PASSWORD, as the other demo accounts
const SUB_ID = "dev-scenario-subscription";
const DAY = 86_400_000;

export type Stage = "active" | "failed" | "lapsed";

export const devScenarioAllowed = () => process.env.NODE_ENV !== "production" && process.env.VERCEL_ENV !== "production";

async function removeUser(email: string) {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (!row) return;
  await beforeAccountDeleted(row.id);
  await db.delete(user).where(eq(user.id, row.id)); // profile, saves and subscription rows go with it
}

async function newUser(email: string, first: string, last: string, role: "provider" | "patient", joined: Date) {
  const id = crypto.randomUUID();
  await db.insert(user).values({ id, name: `${first} ${last}`, email, emailVerified: true, role, firstName: first, lastName: last, ageConfirmedAt: joined, createdAt: joined });
  await db.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(PASSWORD) });
  return id;
}

/** Deletes both accounts and builds them again, with Jordan paying. */
export async function buildScenario() {
  if (!devScenarioAllowed()) throw new Error("Not available in production.");
  await dbReady;
  await removeUser(SCENARIO_PROVIDER_EMAIL);
  await removeUser(SCENARIO_PATIENT_EMAIL);

  // Jordan's profile is copied from a sample (story, fees, locations,
  // verified licenses), then made a real provider with Jordan's name.
  const [source] = await db
    .select()
    .from(providerProfile)
    .where(and(eq(providerProfile.isSample, true), isNotNull(providerProfile.approvedAt)))
    .orderBy(asc(providerProfile.createdAt), asc(providerProfile.id))
    .offset(8)
    .limit(1);
  if (!source) throw new Error("No sample providers to copy. Add them in Admin → All providers.");

  const now = Date.now();
  const providerId = await newUser(SCENARIO_PROVIDER_EMAIL, "Jordan", "Hale", "provider", new Date(now - 90 * DAY));
  const patientId = await newUser(SCENARIO_PATIENT_EMAIL, "Sam", "Carter", "patient", new Date(now - 40 * DAY));

  /* eslint-disable @typescript-eslint/no-unused-vars -- dropped from the copy */
  const { id: _id, userId: _u, publicId: _p, isSample: _s, foundingAt: _f, pastDueSince: _d, createdAt: _c, updatedAt: _up, ...profile } = source;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const [created] = await db
    .insert(providerProfile)
    .values({ ...profile, userId: providerId, firstName: "Jordan", lastName: "Hale", businessName: null, displayAsBusiness: false, status: "approved", approvedAt: new Date(now - 60 * DAY), isSample: false })
    .returning({ id: providerProfile.id });

  const [locations, licenses] = await Promise.all([
    db.select().from(providerLocation).where(eq(providerLocation.profileId, source.id)),
    db.select().from(providerLicense).where(and(eq(providerLicense.profileId, source.id), eq(providerLicense.status, "verified"))),
  ]);
  if (locations.length) await db.insert(providerLocation).values(locations.map(({ id: _i, ...l }) => ({ ...l, profileId: created.id }))); // eslint-disable-line @typescript-eslint/no-unused-vars
  if (licenses.length) await db.insert(providerLicense).values(licenses.map(({ id: _i, ...l }) => ({ ...l, profileId: created.id }))); // eslint-disable-line @typescript-eslint/no-unused-vars

  await db.insert(savedProvider).values({ userId: patientId, profileId: created.id, createdAt: new Date(now - 20 * DAY) });
  await setStage("active");
}

/** Moves Jordan's billing to a stage, as Stripe's webhooks would. */
export async function setStage(stage: Stage) {
  if (!devScenarioAllowed()) throw new Error("Not available in production.");
  await dbReady;
  const [provider] = await db.select({ id: user.id }).from(user).where(eq(user.email, SCENARIO_PROVIDER_EMAIL));
  if (!provider) return;
  const now = Date.now();
  // Failed today (inside the 3-day grace), or 5 days ago (past it).
  const pastDueSince = stage === "active" ? null : new Date(now - (stage === "failed" ? 2 * 3_600_000 : 5 * DAY));
  const periodStart = new Date(now - (stage === "active" ? 10 : 35) * DAY);
  const row = {
    plan: "base",
    referenceId: provider.id,
    stripeCustomerId: "cus_dev_scenario",
    stripeSubscriptionId: "sub_dev_scenario",
    status: stage === "active" ? "active" : "past_due",
    periodStart,
    periodEnd: new Date(periodStart.getTime() + 30 * DAY),
    cancelAtPeriodEnd: false,
  };
  await db.insert(subscription).values({ id: SUB_ID, ...row }).onConflictDoUpdate({ target: subscription.id, set: row });
  await db.update(providerProfile).set({ pastDueSince }).where(eq(providerProfile.userId, provider.id));
}

/** What the dev page shows: the stage, Jordan's profile link, and whether the app bills locally. */
export async function scenarioState() {
  await dbReady;
  const rows = await db.select({ id: user.id, email: user.email }).from(user).where(inArray(user.email, [SCENARIO_PROVIDER_EMAIL, SCENARIO_PATIENT_EMAIL]));
  const providerUser = rows.find((r) => r.email === SCENARIO_PROVIDER_EMAIL);
  if (!providerUser || rows.length < 2) return { built: false as const, billingOn: stripeConfigured() };
  const [p] = await db.select().from(providerProfile).where(eq(providerProfile.userId, providerUser.id));
  const [sub] = await db.select({ status: subscription.status }).from(subscription).where(eq(subscription.id, SUB_ID));
  const stage: Stage | null = !sub ? null : sub.status === "active" ? "active" : p?.pastDueSince && Date.now() - p.pastDueSince.getTime() >= 3 * DAY ? "lapsed" : "failed";
  return { built: true as const, billingOn: stripeConfigured(), stage, href: p ? profilePath({ ...p, businessName: p.businessName }) : null };
}
