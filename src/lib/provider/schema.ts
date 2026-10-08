import { z } from "zod";
import {
  AGE_GROUPS,
  APPROACHES,
  BANNER_STYLES,
  BASE_PLAN_LOCATIONS,
  GENDERS,
  SESSION_FORMATS,
  SESSION_PARTICIPANTS,
  US_STATES,
} from "@/lib/taxonomy";

// One schema per editable section of a provider profile. The onboarding
// wizard and the profile editor use the same sections, so a field is
// validated identically everywhere (client via react-hook-form, server in the
// action). Messages are new microcopy — TODO(client).

const values = <T extends readonly { value: string }[]>(list: T) =>
  list.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer.`);

/** Figma: "Maximum 1600 words." */
const words = (label: string, maxWords: number) =>
  requiredText(label, 12_000).refine((v) => v.split(/\s+/).filter(Boolean).length <= maxWords, {
    message: `Keep it under ${maxWords} words.`,
  });

/** Provider-typed chip values ("Add specialty") are allowed, so lists are free strings with limits. */
const chipList = (label: string, { min = 1, max = 20 } = {}) =>
  z
    .array(z.string().trim().min(1).max(40, "Each item must be 40 characters or fewer."))
    .min(min, `Choose at least ${min === 1 ? "one" : min} ${label}.`)
    .max(max, `Choose up to ${max} ${label}.`)
    .transform((list) => Array.from(new Set(list)));

export const identitySchema = z.object({
  firstName: requiredText("First name", 60),
  lastName: requiredText("Last name", 60),
  titleCredentials: requiredText("Title / credentials", 120),
  pronouns: optionalText(30),
  bannerStyle: z.enum(values(BANNER_STYLES)),
  businessName: optionalText(100),
  displayAsBusiness: z.boolean(),
});

/** Figma P2: the photo is uploaded first; the section only records which one. */
export const pictureSchema = z.object({ photoId: z.string().min(1, "Select a picture to upload.") });

export const storySchema = z.object({
  whoYouWorkWith: words("Who you work with", 1600),
  about: words("About you", 1600),
});

export const clientsSchema = z.object({
  sessionParticipants: z.array(z.enum(values(SESSION_PARTICIPANTS))).min(1, "Choose at least one."),
  ageGroups: z.array(z.enum(values(AGE_GROUPS))).min(1, "Choose at least one."),
});

export const expertiseSchema = z
  .object({
    specialties: chipList("specialties", { max: 15 }),
    primarySpecialty: z.string().trim().min(1, "Choose your main specialty."),
    approaches: chipList("approaches", { max: 10 }),
    languages: chipList("languages", { max: 10 }),
  })
  .refine((v) => v.specialties.includes(v.primarySpecialty), {
    path: ["primarySpecialty"],
    message: "Your main specialty must be one of your specialties.",
  });

const money = z
  .union([z.literal(""), z.coerce.number().int("Whole dollars only.").min(0).max(2000, "That seems too high.")])
  .transform((v) => (v === "" ? null : v));

export const practiceSchema = z.object({
  gender: z.union([z.enum(values(GENDERS)), z.literal("")]).transform((v) => v || null),
  feeIndividual: money,
  feeCouples: money,
  slidingScale: z.boolean(),
  acceptingNewClients: z.boolean(),
  education: z
    .array(
      z.object({
        degree: requiredText("Degree", 120),
        school: requiredText("School", 160),
        year: z
          .union([z.literal(""), z.coerce.number().int().min(1950).max(new Date().getFullYear())])
          .transform((v) => (v === "" ? null : v)),
      }),
    )
    .max(4),
});

export const locationSchema = z.object({
  id: z.string().optional(),
  state: z.enum(values(US_STATES), { message: "Choose a state." }),
  city: requiredText("City", 80),
  zip: z
    .string()
    .trim()
    .regex(/^(\d{5})?$/, "Enter a 5-digit ZIP code."),
  practiceName: optionalText(120),
  address: optionalText(200),
  formats: z.array(z.enum(values(SESSION_FORMATS))).min(1, "Choose at least one session format."),
  isPrimary: z.boolean(),
});

export const locationsSchema = z
  .object({ locations: z.array(locationSchema).min(1, "Add at least one location.") })
  .superRefine(({ locations }, ctx) => {
    const states = locations.map((l) => l.state);
    if (new Set(states).size !== states.length) {
      ctx.addIssue({ code: "custom", path: ["locations"], message: "Each state can only be listed once." });
    }
    if (locations.filter((l) => l.isPrimary).length !== 1) {
      ctx.addIssue({ code: "custom", path: ["locations"], message: "Mark exactly one location as primary." });
    }
  });

export const licenseSchema = z.object({
  state: z.enum(values(US_STATES)),
  licenseNumber: requiredText("License number", 40),
  issuingBody: requiredText("Issuing body", 160),
  documentId: z.string().min(1, "Upload your license document."),
});

export const credentialsSchema = z.object({
  npiNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "An NPI number is 10 digits."),
  yearsExperience: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(70)])
    .transform((v) => (v === "" ? null : v)),
  licenses: z.array(licenseSchema).min(1),
});

export const submitSchema = z.object({
  attest: z.literal(true, { message: "Please confirm before submitting." }),
});

export type IdentityInput = z.input<typeof identitySchema>;
export type StoryInput = z.input<typeof storySchema>;
export type ClientsInput = z.input<typeof clientsSchema>;
export type ExpertiseInput = z.input<typeof expertiseSchema>;
export type PracticeInput = z.input<typeof practiceSchema>;
export type LocationsInput = z.input<typeof locationsSchema>;
export type CredentialsInput = z.input<typeof credentialsSchema>;

/** Practice locations a provider may list: the base plan plus any purchased extras. */
export function locationLimit(extraLocations = 0) {
  return BASE_PLAN_LOCATIONS + extraLocations;
}
