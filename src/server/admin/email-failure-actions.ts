"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth/session";
import { markEmailFailuresHandled } from "./email-failures";

// Admin → Failed emails: "Mark handled" on one row, or on all of them.

export async function markEmailFailureHandled(id: string) {
  const { user } = await requireRole("admin", "/admin/emails");
  if (typeof id !== "string" || !id || id.length > 64) return;
  await markEmailFailuresHandled(user.id, id);
  revalidatePath("/admin", "layout");
}

export async function markAllEmailFailuresHandled() {
  const { user } = await requireRole("admin", "/admin/emails");
  await markEmailFailuresHandled(user.id);
  revalidatePath("/admin", "layout");
}
