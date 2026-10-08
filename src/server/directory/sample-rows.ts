import { BANNER_STYLES } from "@/lib/taxonomy";
import type { SampleProvider } from "./sample-data";

// What gets stored for each sample provider, derived the same way every time
// (license numbers, NPIs, licensing boards, photos). Shared by the admin's
// "Add sample providers" and the seed migration (scripts/sample-seed-sql.ts),
// so both create identical profiles. No database access here.

export const SAMPLE_DOMAIN = "samples.psychmind.test";

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

export const issuingBody = (state: string, title: string) =>
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
export function npi(seed: number) {
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

export const sampleEmail = (index: number) => `sample-${String(index + 1).padStart(2, "0")}@${SAMPLE_DOMAIN}`;

/** Everything stored for sample number `index` (0-based), minus ids and timestamps. */
export function sampleRows(s: SampleProvider, index: number) {
  return {
    user: {
      name: `${s.first} ${s.last}`,
      email: sampleEmail(index),
      emailVerified: true,
      role: "provider" as const,
      firstName: s.first,
      lastName: s.last,
    },
    profile: {
      status: "approved" as const,
      isSample: true,
      externalPhotoUrl: photoUrl(s.photo),
      onboardingStep: "review",
      firstName: s.first,
      lastName: s.last,
      titleCredentials: s.title,
      pronouns: s.pronouns,
      bannerStyle: BANNER_STYLES[index % BANNER_STYLES.length].value,
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
      npiNumber: npi(index + 1),
      yearsExperience: s.years,
    },
    /** Approved this many days ago, so the list keeps the samples' order. */
    approvedDaysAgo: index * 3 + 2,
    locations: s.locations.map((l, j) => ({
      state: l.state,
      city: l.city,
      zip: l.zip,
      practiceName: l.practice ?? null,
      address: l.address ?? null,
      formats: l.formats as string[],
      isPrimary: j === 0,
      sortOrder: j,
    })),
    licenses: s.locations.map((l, j) => ({
      state: l.state,
      licenseNumber: licenseNumber(s, l.state, (index + 1) * 10 + j),
      issuingBody: issuingBody(l.state, s.title),
      status: "verified" as const,
    })),
  };
}
