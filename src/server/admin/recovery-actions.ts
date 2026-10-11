"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { completeRecovery, declineRecovery } from "@/server/account/recovery";
import { requireRole } from "@/server/auth/session";

// Admin → Account recovery: move the account to the new address, or decline.
// TODO(client): copy.

export type RecoveryDecisionState = { ok?: boolean; error?: string } | null;

const schema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("complete"), id: z.string().min(1), turnOffTwoFactor: z.string().optional() }),
  z.object({
    decision: z.literal("decline"),
    id: z.string().min(1),
    note: z.string().trim().min(10, "Write a short note for them (at least 10 characters).").max(1000),
  }),
]);

export async function decideRecovery(_prev: RecoveryDecisionState, form: FormData): Promise<RecoveryDecisionState> {
  const { user: me } = await requireRole("admin", "/admin/recovery");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await rateLimit("admin-recovery", me.id, 30, "1 h")).ok) return { error: "Too many decisions. Try again later." };
  const v = parsed.data;
  const result =
    v.decision === "complete" ? await completeRecovery(v.id, me.id, v.turnOffTwoFactor === "on") : await declineRecovery(v.id, me.id, v.note);
  revalidatePath("/admin/recovery", "layout");
  return result.ok ? { ok: true } : { error: result.error };
}
