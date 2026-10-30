"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, providerLicense, providerProfile, user } from "@/db/schema";
import { hasPending } from "@/lib/provider/review";
import { requireRole } from "@/server/auth/session";
import { sendEmail } from "@/server/email";
import { profileChangesApprovedEmail, profileChangesDeclinedEmail, providerDecisionEmail } from "@/server/emails";
import { appUrl } from "@/server/url";

// Verification decisions (admin only). Every decision is recorded in the
// audit log and emailed to the provider. A reason is required for anything
// other than approval, and it's shown to the provider. A verified provider's
// later changes (name, title, NPI, licenses: lib/provider/review.ts) are
// approved, which applies them, or declined, which keeps the verified details.

export type DecisionState = { error?: string; ok?: boolean } | null;

const decisionSchema = z
  .object({
    profileId: z.string().min(1),
    decision: z.enum(["approve", "request_changes", "reject", "suspend", "unsuspend", "decline_changes"]),
    note: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.decision === "approve" || v.decision === "unsuspend" || (v.note && v.note.length > 0), {
    path: ["note"],
    message: "Add a note for the provider explaining what to do.",
  });

const nextStatus = {
  approve: "approved",
  request_changes: "changes_requested",
  reject: "rejected",
  suspend: "suspended",
  unsuspend: "approved",
} as const;

export async function decideProvider(_prev: DecisionState, form: FormData): Promise<DecisionState> {
  const { user: admin } = await requireRole("admin");
  const parsed = decisionSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { profileId, decision, note } = parsed.data;

  const [profile] = await db.select().from(providerProfile).where(eq(providerProfile.id, profileId));
  if (!profile) return { error: "Provider not found." };

  // A verified provider's changes waiting for us: approve applies them.
  const changes = profile.status === "approved" && profile.needsReview;
  if (changes && (decision === "approve" || decision === "decline_changes")) {
    return decideChanges(profile, decision === "approve", note ?? null, admin.id);
  }

  const allowedFrom: Record<Exclude<typeof decision, "decline_changes">, string[]> = {
    approve: ["submitted"],
    request_changes: ["submitted"],
    reject: ["submitted"],
    suspend: ["approved"],
    unsuspend: ["suspended"],
  };
  if (decision === "decline_changes" || !allowedFrom[decision].includes(profile.status)) {
    return { error: `This provider is "${profile.status}" — that action isn't available.` };
  }

  // Changes made before a suspension are still waiting once it's lifted.
  const waiting =
    decision === "unsuspend" &&
    (hasPending(profile.pendingChanges) ||
      (
        await db
          .select({ status: providerLicense.status, pending: providerLicense.pending })
          .from(providerLicense)
          .where(eq(providerLicense.profileId, profileId))
      ).some((l) => l.status === "pending" || l.pending));
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(providerProfile)
      .set({
        status: nextStatus[decision],
        reviewNote: decision === "approve" || decision === "unsuspend" ? null : note,
        approvedAt: decision === "approve" ? (profile.approvedAt ?? now) : profile.approvedAt,
        needsReview: waiting,
      })
      .where(eq(providerProfile.id, profileId));
    if (decision === "approve") {
      await tx.update(providerLicense).set({ status: "verified" }).where(eq(providerLicense.profileId, profileId));
    }
    await tx.insert(auditLog).values({
      actorId: admin.id,
      action: `provider.${decision}`,
      targetType: "provider_profile",
      targetId: profileId,
      meta: note ? { note } : {},
    });
  });

  const [owner] = await db.select({ email: user.email }).from(user).where(eq(user.id, profile.userId));
  const emailKind = decision === "approve" ? "approved" : decision === "request_changes" ? "changes_requested" : decision === "reject" ? "rejected" : null;
  if (owner && emailKind && !(decision === "approve" && profile.status === "approved")) {
    await sendEmail(providerDecisionEmail(owner.email, emailKind, await appUrl("/provider"))).catch((err) =>
      console.error("decision email failed", err),
    );
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

type Profile = typeof providerProfile.$inferSelect;

/** Approve: the requested name, title, NPI and license details replace the
 *  verified ones, and new licenses are verified (their states go live).
 *  Decline: the verified details stay, new licenses are marked rejected, and
 *  the note is shown to the provider. */
async function decideChanges(profile: Profile, approve: boolean, note: string | null, adminId: string): Promise<DecisionState> {
  const pending = profile.pendingChanges ?? {};
  const licenses = await db.select().from(providerLicense).where(eq(providerLicense.profileId, profile.id));
  const states = licenses.filter((l) => l.pending || l.status === "pending").map((l) => l.state);
  const firstName = typeof pending.firstName === "string" ? pending.firstName : profile.firstName;
  const lastName = typeof pending.lastName === "string" ? pending.lastName : profile.lastName;

  await db.transaction(async (tx) => {
    if (approve) {
      const set: Partial<Profile> = { pendingChanges: null, needsReview: false, reviewNote: null, firstName, lastName };
      if (typeof pending.titleCredentials === "string") set.titleCredentials = pending.titleCredentials;
      if ("businessName" in pending) set.businessName = (pending.businessName as string) || null;
      if (typeof pending.displayAsBusiness === "boolean") set.displayAsBusiness = pending.displayAsBusiness;
      if (typeof pending.npiNumber === "string") set.npiNumber = pending.npiNumber;
      await tx.update(providerProfile).set(set).where(eq(providerProfile.id, profile.id));
      if ("firstName" in pending || "lastName" in pending) {
        await tx.update(user).set({ firstName, lastName, name: `${firstName} ${lastName}` }).where(eq(user.id, profile.userId));
      }
      for (const l of licenses) {
        if (l.pending) await tx.update(providerLicense).set({ ...l.pending, pending: null, status: "verified" }).where(eq(providerLicense.id, l.id));
        else if (l.status === "pending") await tx.update(providerLicense).set({ status: "verified" }).where(eq(providerLicense.id, l.id));
      }
    } else {
      await tx.update(providerProfile).set({ pendingChanges: null, needsReview: false, reviewNote: note }).where(eq(providerProfile.id, profile.id));
      for (const l of licenses) {
        if (l.pending) await tx.update(providerLicense).set({ pending: null }).where(eq(providerLicense.id, l.id));
        else if (l.status === "pending") await tx.update(providerLicense).set({ status: "rejected" }).where(eq(providerLicense.id, l.id));
      }
    }
    await tx.insert(auditLog).values({
      actorId: adminId,
      action: approve ? "provider.approve_changes" : "provider.decline_changes",
      targetType: "provider_profile",
      targetId: profile.id,
      meta: { fields: Object.keys(pending), licenses: states, ...(note ? { note } : {}) },
    });
  });

  const [owner] = await db.select({ email: user.email }).from(user).where(eq(user.id, profile.userId));
  if (owner) {
    const url = await appUrl("/provider/profile");
    const email = approve ? profileChangesApprovedEmail(owner.email, url) : profileChangesDeclinedEmail(owner.email, note ?? "", url);
    await sendEmail(email).catch((err) => console.error("changes email failed", err));
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/provider", "layout");
  return { ok: true };
}
