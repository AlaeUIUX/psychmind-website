import "server-only";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { account, analyticsDaily, analyticsTerm, providerLicense, providerLocation, providerProfile, sessionRequest, user } from "@/db/schema";
import { addDays, dayOf } from "@/lib/analytics/range";
import { beforeAccountDeleted } from "@/server/account/cleanup";
import { forgetProviderAnalytics } from "@/server/analytics/forget";
import { SAMPLE_PROVIDERS } from "@/server/directory/sample-data";
import { sampleRows } from "@/server/directory/sample-rows";

// A local-only provider with a full, lived-in dashboard: an approved, listed
// profile, four months of analytics, search terms and session requests, so the
// Overview, Analytics and Requests can be checked with real-looking numbers
// instead of empty states (owner request, 2026-10-29). Every log-in rebuilds it
// with fresh dates. Never in production builds. The password is the e2e
// TEST_PASSWORD. All names and emails are made up (.test addresses).

export const DEMO_PROVIDER_EMAIL = "demo-provider@psychmind.test";
const DEMO_PROVIDER_PASSWORD = "Calm-Harbor-2026!"; // tests/e2e/fixtures.ts

export const isDemoProvider = (email: string) =>
  process.env.NODE_ENV !== "production" && email.trim().toLowerCase() === DEMO_PROVIDER_EMAIL;

/** A steady pseudo-random sequence, so every rebuild looks alike. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const PATIENTS = [
  ["Jordan Miller", "individuals", "online", "Looking for help with anxiety at work and trouble sleeping."],
  ["Priya Shah", "couples", "in_person", "My partner and I keep having the same argument and want to communicate better."],
  ["Marcus Lee", "individuals", "online", null],
  ["Elena García", "individuals", "in_person", "Going through a big life change and would like someone to talk to."],
  ["Sam Okafor", "individuals", "online", "Recently lost a parent."],
  ["Hannah Brooks", "couples", "online", null],
  ["Diego Torres", "individuals", "in_person", "Stress and burnout."],
  ["Aisha Rahman", "individuals", "online", "First time trying therapy, a little nervous."],
  ["Noah Fischer", "individuals", "online", null],
  ["Grace Kim", "couples", "in_person", "We are expecting our first child and want support."],
  ["Owen Clarke", "individuals", "online", "Panic attacks before presentations."],
  ["Lucía Morales", "individuals", "online", null],
  ["Ben Carter", "individuals", "in_person", "Low mood for a few months."],
  ["Zoe Martin", "individuals", "online", "Would like help with self-esteem."],
] as const;

const TERMS = [
  "Anxiety · Online · Florida",
  "Anxiety · In-person · Florida",
  "Relationships · Online · Florida",
  "Depression · Online · Florida",
  "Self-esteem · Online",
  "Life transitions · Florida",
];

/** Deletes the demo provider and builds it again, full of data. Call only when `isDemoProvider`. */
export async function resetDemoProvider() {
  if (process.env.NODE_ENV === "production") return;
  await dbReady;

  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, DEMO_PROVIDER_EMAIL));
  if (existing) {
    const profiles = await db.select({ id: providerProfile.id }).from(providerProfile).where(eq(providerProfile.userId, existing.id));
    await forgetProviderAnalytics(profiles.map((p) => p.id));
    await beforeAccountDeleted(existing.id);
    await db.delete(user).where(eq(user.id, existing.id));
  }

  // The first sample's profile, as a real (not sample) provider.
  const rows = sampleRows(SAMPLE_PROVIDERS[0], 0);
  const first = "Maya";
  const last = "Ellison";
  const id = crypto.randomUUID();
  const hash = await hashPassword(DEMO_PROVIDER_PASSWORD);
  const now = Date.now();
  const approvedAt = new Date(now - 120 * 86_400_000);

  const profileId = await db.transaction(async (tx) => {
    await tx.insert(user).values({ ...rows.user, id, name: `${first} ${last}`, email: DEMO_PROVIDER_EMAIL, firstName: first, lastName: last });
    await tx.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash });
    const [profile] = await tx
      .insert(providerProfile)
      .values({
        userId: id,
        ...rows.profile,
        isSample: false,
        firstName: first,
        lastName: last,
        npiNumber: "1972648301",
        acceptingNewClients: true,
        submittedAt: new Date(approvedAt.getTime() - 2 * 86_400_000),
        approvedAt,
      })
      .returning({ id: providerProfile.id });
    await tx.insert(providerLocation).values(rows.locations.map((l) => ({ profileId: profile.id, ...l })));
    await tx.insert(providerLicense).values(rows.licenses.map((l, j) => ({ profileId: profile.id, ...l, licenseNumber: `MH${48210 + j}` })));
    return profile.id;
  });

  // Four months of daily counts, gently rising, with weekday rhythm.
  const rand = seeded(7);
  const today = dayOf();
  const daily: (typeof analyticsDaily.$inferInsert)[] = [];
  const terms: (typeof analyticsTerm.$inferInsert)[] = [];
  for (let back = 120; back >= 0; back--) {
    const day = addDays(today, -back);
    const growth = 1 + (120 - back) / 90;
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    const rhythm = weekday === 0 || weekday === 6 ? 0.7 : 1;
    const impressions = Math.round((28 + rand() * 22) * growth * rhythm);
    const quickLooks = Math.round(impressions * (0.12 + rand() * 0.06));
    const views = Math.round(quickLooks * (0.35 + rand() * 0.2));
    const saves = Math.round(quickLooks * (0.08 + rand() * 0.08));
    daily.push(
      { day, metric: "impression", profileId, count: impressions },
      { day, metric: "quick_look", profileId, count: quickLooks },
      { day, metric: "profile_view", profileId, count: views },
    );
    if (saves) daily.push({ day, metric: "save", profileId, count: saves });
    for (const [t, term] of TERMS.entries()) {
      const n = Math.round(impressions * (0.3 / (t + 1)) * (0.6 + rand() * 0.8));
      if (n) terms.push({ day, profileId, term, count: n });
    }
  }
  for (let i = 0; i < daily.length; i += 500) await db.insert(analyticsDaily).values(daily.slice(i, i + 500));
  for (let i = 0; i < terms.length; i += 500) await db.insert(analyticsTerm).values(terms.slice(i, i + 500));

  // Session requests over the last two months; the four newest still new.
  await db.insert(sessionRequest).values(
    PATIENTS.map(([name, sessionType, format, note], i) => {
      const createdAt = new Date(now - (i === 0 ? 3 : i * 4.3 + rand() * 2) * 3_600_000 * (i < 4 ? 6 : 24));
      return {
        profileId,
        name,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.test`,
        phone: i % 3 === 0 ? null : `(305) 555-01${String(10 + i).padStart(2, "0")}`,
        sessionType,
        format,
        note,
        status: i < 4 ? ("new" as const) : ("contacted" as const),
        contactedAt: i < 4 ? null : new Date(createdAt.getTime() + 20 * 3_600_000),
        createdAt,
      };
    }),
  );
}
