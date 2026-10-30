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
import { hasPending, mergePending, sameLicense, type PendingChanges } from "@/lib/provider/review";
import type { ActionResult } from "@/lib/provider/state";
import { furthest, nextStep, type StepKey } from "@/lib/provider/steps";
import { requireRole } from "@/server/auth/session";
import { sendEmail } from "@/server/email";
import { optedOutOf } from "@/server/notifications";
import { deleteFile } from "@/server/storage";
import { adminNewSubmissionEmail, providerSubmittedEmail } from "@/server/emails";
import { appUrl } from "@/server/url";
import { ensureProfile, loadProviderState } from "./data";

// Mutations for the provider's own profile. Every action re-checks the
// session and role, re-validates with the shared Zod schemas, and only ever
// touches the caller's own rows. Once a profile is verified, changes to the
// name, title, NPI and licenses wait for an admin (lib/provider/review.ts).

// TODO(client): copy.
const SENT_FOR_REVIEW =
  "Saved. Our team checks changes to your name, title, NPI and licenses before they show on your profile, usually within 1–2 business days.";

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
  const needsReview = profile.status === "approved" ? await refreshReview(profile.id) : false;

  const onboarding = profile.status === "draft" || profile.status === "changes_requested";
  const next = nextStep(section);
  if (onboarding && next) {
    await db
      .update(providerProfile)
      .set({ onboardingStep: furthest(profile.onboardingStep, next) })
      .where(eq(providerProfile.id, profile.id));
  }
  revalidatePath("/provider", "layout");
  if (needsReview) revalidatePath("/admin", "layout");
  return {
    ok: true,
    redirectTo: onboarding && next ? `/provider/onboarding/${next}` : undefined,
    notice: needsReview && result.reviewed ? SENT_FOR_REVIEW : undefined,
  };
}

type Profile = typeof providerProfile.$inferSelect;
type SaveResult = ActionResult & { reviewed?: boolean };

/** The reviewed fields as verified (what the public profile shows). */
const verifiedOf = (p: Profile) => ({
  firstName: p.firstName,
  lastName: p.lastName,
  titleCredentials: p.titleCredentials,
  businessName: p.businessName ?? "",
  displayAsBusiness: p.displayAsBusiness,
  npiNumber: p.npiNumber ?? "",
});

const samePending = (a: PendingChanges | null | undefined, b: PendingChanges | null | undefined) =>
  JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

/** A verified profile waits for an admin while anything is pending: reviewed
 *  fields, or a license that's new or edited. A fresh change also clears the
 *  note from a previous decline. Returns whether it's waiting. */
async function refreshReview(profileId: string) {
  const [p] = await db.select({ pendingChanges: providerProfile.pendingChanges }).from(providerProfile).where(eq(providerProfile.id, profileId));
  const licenses = await db
    .select({ status: providerLicense.status, pending: providerLicense.pending })
    .from(providerLicense)
    .where(eq(providerLicense.profileId, profileId));
  const needsReview = hasPending(p?.pendingChanges) || licenses.some((l) => l.status === "pending" || l.pending);
  await db
    .update(providerProfile)
    .set(needsReview ? { needsReview, reviewNote: null } : { needsReview })
    .where(eq(providerProfile.id, profileId));
  return needsReview;
}

async function removeUpload(id: string, ownerId: string) {
  const [old] = await db
    .delete(upload)
    .where(and(eq(upload.id, id), eq(upload.ownerId, ownerId)))
    .returning({ storageKey: upload.storageKey });
  if (old) await deleteFile(old.storageKey);
}

async function saveSection(section: SectionKey, data: never, profile: Profile, userId: string): Promise<SaveResult> {
  const where = eq(providerProfile.id, profile.id);
  const live = profile.status === "approved";
  switch (section) {
    case "identity": {
      const { bannerId, ...v } = data as z.output<typeof identitySchema>;
      let banner: string | null = null;
      if (bannerId) {
        const [file] = await db
          .select({ id: upload.id })
          .from(upload)
          .where(and(eq(upload.id, bannerId), eq(upload.ownerId, userId), eq(upload.kind, "banner")));
        if (!file) return { ok: false, fieldErrors: { bannerId: "Upload your banner again." } };
        banner = file.id;
      }
      const free = { bannerId: banner, useDefaultBanner: v.useDefaultBanner, pronouns: v.pronouns || null };
      let reviewed = false;
      if (live) {
        // Who they are waits for an admin; the verified name stays public meanwhile.
        const pending = mergePending(verifiedOf(profile), profile.pendingChanges, {
          firstName: v.firstName,
          lastName: v.lastName,
          titleCredentials: v.titleCredentials,
          businessName: v.businessName ?? "",
          displayAsBusiness: v.displayAsBusiness,
        });
        reviewed = hasPending(pending) && !samePending(pending, profile.pendingChanges);
        await db
          .update(providerProfile)
          .set({ ...free, pendingChanges: hasPending(pending) ? pending : null })
          .where(where);
      } else {
        await db
          .update(providerProfile)
          .set({
            ...free,
            firstName: v.firstName,
            lastName: v.lastName,
            titleCredentials: v.titleCredentials,
            businessName: v.businessName || null,
            displayAsBusiness: v.displayAsBusiness,
          })
          .where(where);
        await db
          .update(user)
          .set({ firstName: v.firstName, lastName: v.lastName, name: `${v.firstName} ${v.lastName}` })
          .where(eq(user.id, userId));
      }
      // A replaced banner is no longer shown anywhere (one chosen away from, for the default, is kept).
      if (profile.bannerId && profile.bannerId !== banner) await removeUpload(profile.bannerId, userId);
      return { ok: true, reviewed };
    }
    case "picture": {
      const v = data as z.output<typeof pictureSchema>;
      const [file] = await db
        .select()
        .from(upload)
        .where(and(eq(upload.id, v.photoId), eq(upload.ownerId, userId), eq(upload.kind, "photo")));
      if (!file) return { ok: false, fieldErrors: { photoId: "Upload your picture again." } };
      await db.update(providerProfile).set({ photoId: file.id }).where(where);
      // A replaced photo is no longer shown anywhere: drop its record and bytes.
      if (profile.photoId && profile.photoId !== file.id) await removeUpload(profile.photoId, userId);
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
      let reviewed = false;
      await db.transaction(async (tx) => {
        if (live) {
          // A new NPI waits for an admin, like the name.
          const pending = mergePending(verifiedOf(profile), profile.pendingChanges, { npiNumber: v.npiNumber });
          if (hasPending(pending) && !samePending(pending, profile.pendingChanges)) reviewed = true;
          await tx
            .update(providerProfile)
            .set({ yearsExperience: v.yearsExperience, pendingChanges: hasPending(pending) ? pending : null })
            .where(where);
        } else {
          await tx.update(providerProfile).set({ npiNumber: v.npiNumber, yearsExperience: v.yearsExperience }).where(where);
        }
        for (const l of v.licenses) {
          const old = prior.get(l.state);
          const requested = { licenseNumber: l.licenseNumber, issuingBody: l.issuingBody, documentId: l.documentId };
          if (live && old?.status === "verified") {
            // A verified license stays public as it is; an edit to it waits for an admin.
            const edit = sameLicense(requested, old) ? null : requested;
            if (edit && !(old.pending && sameLicense(edit, old.pending))) reviewed = true;
            await tx.update(providerLicense).set({ pending: edit }).where(eq(providerLicense.id, old.id));
            continue;
          }
          const changed = !old || !sameLicense(requested, old);
          if (changed && live) reviewed = true;
          const row = {
            profileId: profile.id,
            state: l.state,
            ...requested,
            // Any change goes back to "pending" until an admin checks it; a new
            // state stays off the profile and out of search until then.
            status: changed ? ("pending" as const) : (old?.status ?? "pending"),
            pending: null,
          };
          await tx
            .insert(providerLicense)
            .values(row)
            .onConflictDoUpdate({ target: [providerLicense.profileId, providerLicense.state], set: row });
        }
      });
      return { ok: true, reviewed };
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
  const allAdmins = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.role, "admin"));
  const optedOut = await optedOutOf("admin_submissions", allAdmins.map((a) => a.id));
  const admins = allAdmins.filter((a) => !optedOut.has(a.id));
  const [dashboardUrl, reviewUrl, settingsUrl] = await Promise.all([appUrl("/provider"), appUrl(`/admin/providers/${state.id}`), appUrl("/admin/settings")]);
  await Promise.allSettled([
    sendEmail(providerSubmittedEmail(me.email, dashboardUrl)),
    ...admins.map((a) => sendEmail(adminNewSubmissionEmail(a.email, reviewUrl, settingsUrl))),
  ]);

  revalidatePath("/provider", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, redirectTo: "/provider/onboarding/submitted" };
}
