import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
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
    /** Furthest onboarding step reached, so the wizard can resume. */
    onboardingStep: text("onboarding_step").notNull().default("identity"),

    // Identity
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    businessName: text("business_name"),
    displayAsBusiness: boolean("display_as_business").notNull().default(false),
    titleCredentials: text("title_credentials").notNull().default(""),
    pronouns: text("pronouns"),
    bannerStyle: text("banner_style").notNull().default("banner_04"),
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
  (t) => [uniqueIndex("provider_profile_user_idx").on(t.userId), index("provider_profile_status_idx").on(t.status)],
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
