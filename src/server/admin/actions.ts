"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, providerLicense, providerProfile, user } from "@/db/schema";
import { requireRole } from "@/server/auth/session";
import { sendEmail } from "@/server/email";
import { providerDecisionEmail } from "@/server/emails";
import { appUrl } from "@/server/url";

// Verification decisions (admin only). Every decision is recorded in the
// audit log and emailed to the provider. A reason is required for anything
// other than approval, and it's shown to the provider.

export type DecisionState = { error?: string; ok?: boolean } | null;

const decisionSchema = z
  .object({
    profileId: z.string().min(1),
    decision: z.enum(["approve", "request_changes", "reject", "suspend", "unsuspend"]),
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

  const allowedFrom: Record<typeof decision, string[]> = {
    approve: ["submitted"],
    request_changes: ["submitted"],
    reject: ["submitted"],
    suspend: ["approved"],
    unsuspend: ["suspended"],
  };
  if (!allowedFrom[decision].includes(profile.status) && !(decision === "approve" && profile.needsReview)) {
    return { error: `This provider is "${profile.status}" — that action isn't available.` };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(providerProfile)
      .set({
        status: nextStatus[decision],
        reviewNote: decision === "approve" || decision === "unsuspend" ? null : note,
        approvedAt: decision === "approve" ? (profile.approvedAt ?? now) : profile.approvedAt,
        needsReview: false,
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
