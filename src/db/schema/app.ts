import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { PROVIDER_STATUSES } from "@/lib/provider/types";
import { user } from "./auth";

// PsychMind's own tables. Auth tables (user, session, account, verification,
// subscription) are in ./auth and owned by Better Auth.

export const providerStatus = pgEnum("provider_status", PROVIDER_STATUSES);
export const licenseStatus = pgEnum("license_status", ["pending", "verified", "rejected"]);

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/** Short public id for profile links (/providers/sara-okafor-k3f9x2q7): 8
 *  characters from an alphabet without look-alikes. */
const PUBLIC_ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const newPublicId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => PUBLIC_ID_ALPHABET[b % PUBLIC_ID_ALPHABET.length]).join("");
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** One per provider account. Holds everything the public profile shows. */
export const providerProfile = pgTable(
  "provider_profile",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: providerStatus("status").notNull().default("draft"),
    /** Used in the public profile link; never changes. */
    publicId: text("public_id").notNull().$defaultFn(newPublicId),
    /** Sample providers (admin → Sample providers) for previewing search and
     *  profiles. Labelled as samples and never bookable. */
    isSample: boolean("is_sample").notNull().default(false),
    /** Sample providers' photos are hotlinked (Unsplash), not uploads. */
    externalPhotoUrl: text("external_photo_url"),
    /** Furthest onboarding step reached, so the wizard can resume. */
    onboardingStep: text("onboarding_step").notNull().default("identity"),

    // Identity
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    businessName: text("business_name"),
    displayAsBusiness: boolean("display_as_business").notNull().default(false),
    titleCredentials: text("title_credentials").notNull().default(""),
    pronouns: text("pronouns"),
    bannerStyle: text("banner_style").notNull().default("banner_10"),
    photoId: text("photo_id"),

    // Story
    whoYouWorkWith: text("who_you_work_with").notNull().default(""),
    about: text("about").notNull().default(""),

    // Clients and expertise
    sessionParticipants: text("session_participants").array().notNull().default(sql`'{}'::text[]`),
    ageGroups: text("age_groups").array().notNull().default(sql`'{}'::text[]`),
    specialties: text("specialties").array().notNull().default(sql`'{}'::text[]`),
    primarySpecialty: text("primary_specialty"),
    approaches: text("approaches").array().notNull().default(sql`'{}'::text[]`),
    languages: text("languages").array().notNull().default(sql`'{}'::text[]`),

    // Practice details
    gender: text("gender"),
    /** Where session requests are emailed (an assistant, say); the account email when empty. */
    requestEmail: text("request_email"),
    feeIndividual: integer("fee_individual"),
    feeCouples: integer("fee_couples"),
    slidingScale: boolean("sliding_scale").notNull().default(false),
    acceptingNewClients: boolean("accepting_new_clients").notNull().default(true),
    education: jsonb("education").$type<{ degree: string; school: string; year: number | null }[]>().notNull().default([]),

    // Credentials (person-level; per-state licenses are in providerLicense)
    npiNumber: text("npi_number"),
    yearsExperience: integer("years_experience"),

    /** Paid extra practice locations beyond the base plan. */
    extraLocations: integer("extra_locations").notNull().default(0),

    // Review
    reviewNote: text("review_note"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    /** Set when a live provider changes licenses; the admin re-checks them. */
    needsReview: boolean("needs_review").notNull().default(false),

    // Billing visibility (kept in sync from Stripe events)
    pastDueSince: timestamp("past_due_since", { withTimezone: true }),

    ...timestamps,
  },
  (t) => [
    uniqueIndex("provider_profile_user_idx").on(t.userId),
    uniqueIndex("provider_profile_public_id_idx").on(t.publicId),
    index("provider_profile_status_idx").on(t.status),
  ],
);

/** Practice locations (Figma P5). One per state; exactly one is primary. */
export const providerLocation = pgTable(
  "provider_location",
  {
    id: id(),
    profileId: text("profile_id")
      .notNull()
      .references(() => providerProfile.id, { onDelete: "cascade" }),
    state: text("state").notNull(),
    city: text("city").notNull(),
    zip: text("zip"),
    practiceName: text("practice_name"),
    /** Private unless the location offers in-person sessions (Figma P5 helper). */
    address: text("address"),
    formats: text("formats").array().notNull().default(sql`'{}'::text[]`),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("provider_location_state_idx").on(t.profileId, t.state)],
);

/** A license per state the provider practices in (Figma P6). */
export const providerLicense = pgTable(
  "provider_license",
  {
    id: id(),
    profileId: text("profile_id")
      .notNull()
      .references(() => providerProfile.id, { onDelete: "cascade" }),
    state: text("state").notNull(),
    licenseNumber: text("license_number").notNull(),
    issuingBody: text("issuing_body").notNull(),
    documentId: text("document_id"),
    status: licenseStatus("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("provider_license_state_idx").on(t.profileId, t.state)],
);

/** Uploaded files (photos, license documents). Bytes live in the storage driver. */
export const upload = pgTable("upload", {
  id: id(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["photo", "license"] }).notNull(),
  storageKey: text("storage_key").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only record of admin actions (approve, reject, document views…). */
export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_target_idx").on(t.targetType, t.targetId)],
);

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (value) => (Buffer.isBuffer(value) ? value : Buffer.from(value)),
});

/** File bytes when there's no disk or bucket (Vercel without Supabase Storage
 *  yet). Private: only ever read through /api/files/[id]. */
export const fileBlob = pgTable("file_blob", {
  key: text("key").primaryKey(),
  bytes: bytea("bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Shared rate-limit counters when there's no Redis (lib/rate-limit.ts).
 *  Keys are hashes: no IP address or email is stored. */
export const rateLimitCounter = pgTable("rate_limit_counter", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});

/** Providers a patient saved (the heart on cards and profiles). */
export const savedProvider = pgTable(
  "saved_provider",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => providerProfile.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.profileId] }), index("saved_provider_profile_idx").on(t.profileId)],
);

export const requestStatus = pgEnum("session_request_status", ["new", "contacted"]);

/** "Request a session": what a patient (guest or signed in) sent a provider.
 *  The details are emailed to the provider's requests address; the provider
 *  replies outside PsychMind and can mark the request contacted. */
export const sessionRequest = pgTable(
  "session_request",
  {
    id: id(),
    profileId: text("profile_id")
      .notNull()
      .references(() => providerProfile.id, { onDelete: "cascade" }),
    /** Signed-in patients only (their "My requests"); deleted with their account. */
    patientId: text("patient_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    sessionType: text("session_type").notNull(),
    format: text("format").notNull(),
    note: text("note"),
    status: requestStatus("status").notNull().default("new"),
    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    /** Sent to a sample provider: kept, never emailed. */
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("session_request_profile_idx").on(t.profileId, t.createdAt),
    index("session_request_patient_idx").on(t.patientId),
    index("session_request_email_idx").on(t.email, t.profileId),
  ],
);
