"use server";

import { and, eq, inArray, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { db } from "@/db";
import { auditLog, providerLicense, providerLocation, providerProfile, upload, user } from "@/db/schema";
import { isComplete } from "@/lib/provider/completeness";
import {
  clientsSchema,
  credentialsSchema,
  expertiseSchema,
  identitySchema,
  locationLimit,
  locationsSchema,
  pictureSchema,
  practiceSchema,
  storySchema,
  submitSchema,
} from "@/lib/provider/schema";
import type { ActionResult } from "@/lib/provider/state";
import { furthest, nextStep, type StepKey } from "@/lib/provider/steps";
import { requireRole } from "@/server/auth/session";
import { sendEmail } from "@/server/email";
import { adminNewSubmissionEmail, providerSubmittedEmail } from "@/server/emails";
import { appUrl } from "@/server/url";
import { ensureProfile, loadProviderState } from "./data";

// Mutations for the provider's own profile. Every action re-checks the
// session and role, re-validates with the shared Zod schemas, and only ever
// touches the caller's own rows.

export type SectionKey = Exclude<StepKey, "review">;

const schemas = {
  identity: identitySchema,
  picture: pictureSchema,
  story: storySchema,
  clients: clientsSchema,
  expertise: expertiseSchema,
  practice: practiceSchema,
  locations: locationsSchema,
  credentials: credentialsSchema,
} satisfies Record<SectionKey, z.ZodType>;

const EDITABLE = new Set(["draft", "changes_requested", "approved"]);

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[issue.path.join(".") || "root"] ??= issue.message;
  return out;
}

export async function saveProviderSection(section: SectionKey, input: unknown): Promise<ActionResult> {
  const { user: me } = await requireRole("provider");
  const schema = schemas[section];
  if (!schema) return { ok: false, error: "Unknown section." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const profile = await ensureProfile(me.id);
  if (!EDITABLE.has(profile.status)) {
    return {
      ok: false,
      error:
        profile.status === "submitted"
          ? "Your profile is being reviewed. You can edit it again once our team has finished."
          : "Your profile can't be edited right now. Please contact support.",
    };
  }

  const data = parsed.data as never;
  const result = await saveSection(section, data, profile, me.id);
  if (!result.ok) return result;

  const onboarding = profile.status === "draft" || profile.status === "changes_requested";
  const next = nextStep(section);
  if (onboarding && next) {
    await db
      .update(providerProfile)
      .set({ onboardingStep: furthest(profile.onboardingStep, next) })
      .where(eq(providerProfile.id, profile.id));
  }
  revalidatePath("/provider", "layout");
  return { ok: true, redirectTo: onboarding && next ? `/provider/onboarding/${next}` : undefined };
}

type Profile = typeof providerProfile.$inferSelect;

async function saveSection(section: SectionKey, data: never, profile: Profile, userId: string): Promise<ActionResult> {
  const where = eq(providerProfile.id, profile.id);
  switch (section) {
    case "identity": {
      const v = data as z.output<typeof identitySchema>;
      await db
        .update(providerProfile)
        .set({ ...v, pronouns: v.pronouns || null, businessName: v.businessName || null })
        .where(where);
      await db
        .update(user)
        .set({ firstName: v.firstName, lastName: v.lastName, name: `${v.firstName} ${v.lastName}` })
        .where(eq(user.id, userId));
      return { ok: true };
    }
    case "picture": {
      const v = data as z.output<typeof pictureSchema>;
      const [file] = await db
        .select()
        .from(upload)
        .where(and(eq(upload.id, v.photoId), eq(upload.ownerId, userId), eq(upload.kind, "photo")));
      if (!file) return { ok: false, fieldErrors: { photoId: "Upload your picture again." } };
      await db.update(providerProfile).set({ photoId: file.id }).where(where);
      return { ok: true };
    }
    case "story":
    case "clients":
    case "expertise":
    case "practice": {
      await db.update(providerProfile).set(data as Partial<Profile>).where(where);
      return { ok: true };
    }
    case "locations": {
      const { locations } = data as z.output<typeof locationsSchema>;
      if (locations.length > locationLimit(profile.extraLocations)) {
        return { ok: false, error: `Your plan includes up to ${locationLimit(profile.extraLocations)} locations.` };
      }
      const states = locations.map((l) => l.state);
      await db.transaction(async (tx) => {
        await tx
          .delete(providerLocation)
          .where(and(eq(providerLocation.profileId, profile.id), notInArray(providerLocation.state, states)));
        // Licenses only make sense for listed states.
        await tx
          .delete(providerLicense)
          .where(and(eq(providerLicense.profileId, profile.id), notInArray(providerLicense.state, states)));
        for (const [i, l] of locations.entries()) {
          const row = {
            profileId: profile.id,
            state: l.state,
            city: l.city,
            zip: l.zip || null,
            practiceName: l.practiceName || null,
            address: l.address || null,
            formats: l.formats,
            isPrimary: l.isPrimary,
            sortOrder: i,
          };
          await tx
            .insert(providerLocation)
            .values(row)
            .onConflictDoUpdate({ target: [providerLocation.profileId, providerLocation.state], set: row });
        }
      });
      return { ok: true };
    }
    case "credentials": {
      const v = data as z.output<typeof credentialsSchema>;
      const locations = await db
        .select({ state: providerLocation.state })
        .from(providerLocation)
        .where(eq(providerLocation.profileId, profile.id));
      const listed = new Set(locations.map((l) => l.state));
      if (v.licenses.some((l) => !listed.has(l.state)) || v.licenses.length !== listed.size) {
        return { ok: false, error: "Add a license for each of your practice locations." };
      }
      const docIds = v.licenses.map((l) => l.documentId);
      const owned = await db
        .select({ id: upload.id })
        .from(upload)
        .where(and(inArray(upload.id, docIds), eq(upload.ownerId, userId), eq(upload.kind, "license")));
      if (owned.length !== new Set(docIds).size) return { ok: false, error: "Upload your license documents again." };

      const before = await db.select().from(providerLicense).where(eq(providerLicense.profileId, profile.id));
      const prior = new Map(before.map((l) => [l.state, l]));
      let changedLive = false;
      await db.transaction(async (tx) => {
        await tx
          .update(providerProfile)
          .set({ npiNumber: v.npiNumber, yearsExperience: v.yearsExperience })
          .where(where);
        for (const l of v.licenses) {
          const old = prior.get(l.state);
          const changed =
            !old || old.licenseNumber !== l.licenseNumber || old.issuingBody !== l.issuingBody || old.documentId !== l.documentId;
          if (changed && profile.status === "approved") changedLive = true;
          const row = {
            profileId: profile.id,
            state: l.state,
            licenseNumber: l.licenseNumber,
            issuingBody: l.issuingBody,
            documentId: l.documentId,
            // Any change goes back to "pending" until an admin re-checks it.
            status: changed ? ("pending" as const) : (old?.status ?? "pending"),
          };
          await tx
            .insert(providerLicense)
            .values(row)
            .onConflictDoUpdate({ target: [providerLicense.profileId, providerLicense.state], set: row });
        }
        if (changedLive) await tx.update(providerProfile).set({ needsReview: true }).where(where);
      });
      return { ok: true };
    }
  }
}

export async function submitForVerification(input: unknown): Promise<ActionResult> {
  const { user: me } = await requireRole("provider");
  if (!submitSchema.safeParse(input).success) return { ok: false, error: "Please confirm before submitting." };

  const state = await loadProviderState(me.id);
  if (state.status !== "draft" && state.status !== "changes_requested") {
    return { ok: false, error: "Your profile has already been submitted." };
  }
  if (!isComplete(state)) return { ok: false, error: "Finish every section before submitting." };

  await db
    .update(providerProfile)
    .set({ status: "submitted", submittedAt: new Date(), onboardingStep: "review", reviewNote: null })
    .where(eq(providerProfile.id, state.id));
  await db.insert(auditLog).values({ actorId: me.id, action: "provider.submitted", targetType: "provider_profile", targetId: state.id });

  // Emails are best-effort: a mail outage mustn't undo the submission.
  const admins = await db.select({ email: user.email }).from(user).where(eq(user.role, "admin"));
  const [dashboardUrl, reviewUrl] = await Promise.all([appUrl("/provider"), appUrl(`/admin/providers/${state.id}`)]);
  await Promise.allSettled([
    sendEmail(providerSubmittedEmail(me.email, dashboardUrl)),
    ...admins.map((a) => sendEmail(adminNewSubmissionEmail(a.email, reviewUrl))),
  ]);

  revalidatePath("/provider", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, redirectTo: "/provider/onboarding/submitted" };
}
