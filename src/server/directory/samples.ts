import "server-only";
import { and, count, eq, like } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { auditLog, providerLicense, providerLocation, providerProfile, user } from "@/db/schema";
import { BANNER_STYLES } from "@/lib/taxonomy";
import { SAMPLE_PROVIDERS, type SampleProvider } from "./sample-data";

// Adds or removes the 50 sample providers (Admin → Sample providers). Each is
// a provider account that can't log in (no password, and the .test domain
// can't receive mail), with an approved profile, verified licenses for every
// state they practice in, and is_sample set so they're labelled everywhere
// and can't be booked. Removing deletes the accounts; everything attached
// goes with them.

const SAMPLE_DOMAIN = "samples.psychmind.test";

const PSYCHOLOGY_BOARDS: Record<string, string> = {
  AZ: "Arizona Board of Psychologist Examiners",
  GA: "Georgia State Board of Examiners of Psychologists",
  HI: "Hawaii Board of Psychology",
  MA: "Massachusetts Board of Registration of Psychologists",
  MN: "Minnesota Board of Psychology",
  NC: "North Carolina Psychology Board",
  NJ: "New Jersey State Board of Psychological Examiners",
  UT: "Utah Division of Professional Licensing",
  VA: "Virginia Board of Psychology",
};

const COUNSELING_BOARDS: Record<string, string> = {
  AZ: "Arizona Board of Behavioral Health Examiners",
  CA: "California Board of Behavioral Sciences",
  CO: "Colorado Department of Regulatory Agencies",
  FL: "Florida Board of Clinical Social Work, Marriage & Family Therapy and Mental Health Counseling",
  GA: "Georgia Composite Board of Professional Counselors, Social Workers and MFTs",
  IL: "Illinois Department of Financial and Professional Regulation",
  MA: "Massachusetts Board of Registration of Allied Mental Health Professions",
  MD: "Maryland Board of Professional Counselors and Therapists",
  MI: "Michigan Department of Licensing and Regulatory Affairs",
  MN: "Minnesota Board of Behavioral Health and Therapy",
  MO: "Missouri Committee for Professional Counselors",
  NC: "North Carolina Board of Licensed Clinical Mental Health Counselors",
  NJ: "New Jersey Division of Consumer Affairs",
  NM: "New Mexico Counseling and Therapy Practice Board",
  NV: "Nevada Board of Examiners for Marriage and Family Therapists",
  NY: "New York State Education Department, Office of the Professions",
  OH: "Ohio Counselor, Social Worker and Marriage & Family Therapist Board",
  OR: "Oregon Board of Licensed Professional Counselors and Therapists",
  PA: "Pennsylvania State Board of Social Workers, MFTs and Professional Counselors",
  TN: "Tennessee Board of Licensed Professional Counselors",
  TX: "Texas Behavioral Health Executive Council",
  VA: "Virginia Board of Counseling",
  WA: "Washington State Department of Health",
  WI: "Wisconsin Department of Safety and Professional Services",
};

const isPsychologist = (title: string) => /psycholog/i.test(title);
const issuingBody = (state: string, title: string) =>
  (isPsychologist(title) ? (PSYCHOLOGY_BOARDS[state] ?? `${state} Board of Psychology`) : undefined) ??
  COUNSELING_BOARDS[state] ??
  `${state} Behavioral Health Board`;

/** Small deterministic generator so samples look the same every time. */
function digits(seed: number, length: number) {
  let x = (seed * 2654435761) >>> 0;
  let out = "";
  for (let i = 0; i < length; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    out += String((x >>> 16) % 10);
  }
  return out;
}

/** A 10-digit NPI with a valid check digit (Luhn over "80840" + 9 digits). */
function npi(seed: number) {
  const body = "1" + digits(seed, 8);
  const all = ("80840" + body).split("").map(Number);
  let sum = 0;
  for (let i = all.length - 1, double = true; i >= 0; i--, double = !double) {
    let d = all[i];
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return body + ((10 - (sum % 10)) % 10);
}

function licenseNumber(s: SampleProvider, state: string, seed: number) {
  const kind = s.title.match(/\b(LCSW|LICSW|LMSW|LISW-S|LMFT|LPCC|LPC|LMHC|Ph\.D\.|Psy\.D\.)/)?.[1] ?? "LIC";
  const prefix = isPsychologist(s.title) ? "PSY" : kind.replace(/\W/g, "");
  return `${prefix}-${state}-${digits(seed, 5)}`;
}

const photoUrl = (photo: string) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&crop=faces&w=480&h=480&q=80`;

export async function sampleCount() {
  await dbReady;
  const [row] = await db.select({ n: count() }).from(providerProfile).where(eq(providerProfile.isSample, true));
  return row?.n ?? 0;
}

/** Creates the sample providers that don't exist yet. Returns how many were added. */
export async function addSampleProviders(adminId: string) {
  await dbReady;
  const existing = new Set(
    (await db.select({ email: user.email }).from(user).where(like(user.email, `%@${SAMPLE_DOMAIN}`))).map((u) => u.email),
  );
  let added = 0;
  const now = Date.now();

  for (const [i, s] of SAMPLE_PROVIDERS.entries()) {
    const email = `sample-${String(i + 1).padStart(2, "0")}@${SAMPLE_DOMAIN}`;
    if (existing.has(email)) continue;
    const approvedAt = new Date(now - (i * 3 + 2) * 86_400_000);

    const created = await db.transaction(async (tx) => {
      const [u] = await tx
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          name: `${s.first} ${s.last}`,
          email,
          emailVerified: true,
          role: "provider",
          firstName: s.first,
          lastName: s.last,
        })
        // Another admin (or a second click) added this one meanwhile.
        .onConflictDoNothing({ target: user.email })
        .returning({ id: user.id });
      if (!u) return false;
      const [profile] = await tx
        .insert(providerProfile)
        .values({
          userId: u.id,
          status: "approved",
          isSample: true,
          externalPhotoUrl: photoUrl(s.photo),
          onboardingStep: "review",
          firstName: s.first,
          lastName: s.last,
          titleCredentials: s.title,
          pronouns: s.pronouns,
          bannerStyle: BANNER_STYLES[i % BANNER_STYLES.length].value,
          whoYouWorkWith: s.who,
          about: s.about,
          sessionParticipants: s.participants,
          ageGroups: s.ages,
          specialties: s.specialties,
          primarySpecialty: s.specialties[0],
          approaches: s.approaches,
          languages: s.languages,
          gender: s.gender,
          feeIndividual: s.fees[0],
          feeCouples: s.fees[1],
          slidingScale: !!s.sliding,
          acceptingNewClients: !s.full,
          education: s.education.map(([degree, school, year]) => ({ degree, school, year })),
          npiNumber: npi(i + 1),
          yearsExperience: s.years,
          submittedAt: new Date(approvedAt.getTime() - 2 * 86_400_000),
          approvedAt,
        })
        .returning({ id: providerProfile.id });
      await tx.insert(providerLocation).values(
        s.locations.map((l, j) => ({
          profileId: profile.id,
          state: l.state,
          city: l.city,
          zip: l.zip,
          practiceName: l.practice ?? null,
          address: l.address ?? null,
          formats: l.formats,
          isPrimary: j === 0,
          sortOrder: j,
        })),
      );
      await tx.insert(providerLicense).values(
        s.locations.map((l, j) => ({
          profileId: profile.id,
          state: l.state,
          licenseNumber: licenseNumber(s, l.state, (i + 1) * 10 + j),
          issuingBody: issuingBody(l.state, s.title),
          status: "verified" as const,
        })),
      );
      return true;
    });
    if (created) added++;
  }

  if (added) {
    await db.insert(auditLog).values({ actorId: adminId, action: "samples.added", targetType: "directory", targetId: "samples", meta: { added } });
  }
  return added;
}

/** Deletes every sample provider. Returns how many were removed. */
export async function removeSampleProviders(adminId: string) {
  await dbReady;
  const removed = await db
    .delete(user)
    .where(and(like(user.email, `%@${SAMPLE_DOMAIN}`), eq(user.role, "provider")))
    .returning({ id: user.id });
  if (removed.length) {
    await db.insert(auditLog).values({
      actorId: adminId,
      action: "samples.removed",
      targetType: "directory",
      targetId: "samples",
      meta: { removed: removed.length },
    });
  }
  return removed.length;
}
