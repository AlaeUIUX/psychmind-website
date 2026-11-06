"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, dbReady } from "@/db";
import { auditLog, foundingLink } from "@/db/schema";
import { requireRole } from "@/server/auth/session";
import { foundingLinkRow } from "@/server/founding";

// Admin → Settings → Founding link (server/founding.ts). Every change is audited.

export type FoundingActionState = { error?: string; ok?: boolean } | null;

const newCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);

/** Makes the link, or replaces its code: the old link stops working at once. Spots already taken stay taken. */
export async function newFoundingLink(_prev: FoundingActionState, _form: FormData): Promise<FoundingActionState> {
  const { user: admin } = await requireRole("admin");
  await dbReady;
  const existing = await foundingLinkRow();
  const code = newCode();
  await db.transaction(async (tx) => {
    await tx
      .insert(foundingLink)
      .values({ id: "main", code, active: true })
      .onConflictDoUpdate({ target: foundingLink.id, set: { code, active: true, createdAt: new Date() } });
    await tx.insert(auditLog).values({
      actorId: admin.id,
      action: existing ? "founding.link_replaced" : "founding.link_created",
      targetType: "founding_link",
      targetId: "main",
    });
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}

/** Turns the link on or off without changing it. */
export async function setFoundingLinkActive(_prev: FoundingActionState, form: FormData): Promise<FoundingActionState> {
  const { user: admin } = await requireRole("admin");
  await dbReady;
  const active = form.get("active") === "on";
  const existing = await foundingLinkRow();
  if (!existing) return { error: "Create the link first." };
  if (existing.active === active) return { ok: true };
  await db.transaction(async (tx) => {
    await tx.update(foundingLink).set({ active }).where(eq(foundingLink.id, "main"));
    await tx.insert(auditLog).values({
      actorId: admin.id,
      action: active ? "founding.link_opened" : "founding.link_closed",
      targetType: "founding_link",
      targetId: "main",
    });
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}
