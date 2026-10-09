"use server";

import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, dbReady } from "@/db";
import { account, auditLog, session as sessionTable, user } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/server/auth";
import { getSession, hasTwoFactor, homeFor, mustChangePassword, requireRole } from "@/server/auth/session";
import { resetAdminAccess } from "./accounts";

// A new admin's first log-in: their name and their own password, replacing
// the temporary one. Then two-step login (requireRole sends them there).
// TODO(client): copy.

export type AdminPasswordState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | null;

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().min(1, "Last name is required.").max(60),
  // Admins can see every provider's documents: longer than the 8 everyone else needs.
  password: z.string().min(12, "Use at least 12 characters.").max(128, "That password is too long."),
});

/** How long after logging in with the temporary password it can be replaced. */
const FRESH_SESSION_MS = 60 * 60_000;

export async function setAdminPassword(_prev: AdminPasswordState, form: FormData): Promise<AdminPasswordState> {
  const current = await getSession();
  if (!current) redirect("/admin/login");
  if (current.user.role !== "admin") redirect(homeFor(current.user.role));
  if (!mustChangePassword(current.user)) redirect("/admin");
  const values = { firstName: String(form.get("firstName") ?? ""), lastName: String(form.get("lastName") ?? "") };
  // Only right after logging in with the temporary password.
  if (Date.now() - new Date(current.session.createdAt).getTime() > FRESH_SESSION_MS) {
    await auth.api.signOut({ headers: await headers() });
    redirect("/admin/login");
  }

  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors, values };
  }
  const v = parsed.data;
  const id = current.user.id;
  if (!(await rateLimit("admin-password", id, 10, "10 m")).ok) return { error: "Too many attempts. Please wait a few minutes and try again.", values };

  await dbReady;
  const [credential] = await db
    .select({ hash: account.password })
    .from(account)
    .where(and(eq(account.userId, id), eq(account.providerId, "credential")));
  if (credential?.hash && (await verifyPassword({ hash: credential.hash, password: v.password }))) {
    return { fieldErrors: { password: "Choose a new password, not the temporary one." }, values };
  }

  const hash = await hashPassword(v.password);
  await db.transaction(async (tx) => {
    await tx.update(account).set({ password: hash }).where(and(eq(account.userId, id), eq(account.providerId, "credential")));
    await tx
      .update(user)
      .set({ name: `${v.firstName} ${v.lastName}`, firstName: v.firstName, lastName: v.lastName, mustChangePassword: false, tempPasswordExpiresAt: null })
      .where(eq(user.id, id));
    // Any other sign-in that used the temporary password ends here.
    await tx.delete(sessionTable).where(and(eq(sessionTable.userId, id), ne(sessionTable.id, current.session.id)));
    await tx.insert(auditLog).values({ actorId: id, action: "admin.password_set", targetType: "user", targetId: id, meta: {} });
  });
  redirect(hasTwoFactor(current.user) ? "/admin" : "/two-factor/setup");
}

/** Admin → Admins: a new temporary password for someone who's locked out. */
export async function resetAccess(targetId: string): Promise<{ ok: boolean; error?: string }> {
  const { user: me } = await requireRole("admin", "/admin/admins");
  if (!(await rateLimit("admin-reset-access", me.id, 10, "1 h")).ok) return { ok: false, error: "Too many resets. Try again later." };
  const done = await resetAdminAccess(targetId, me.id).catch((err) => {
    console.error("reset admin access failed", err);
    return false;
  });
  revalidatePath("/admin/admins");
  return done ? { ok: true } : { ok: false, error: "That admin's access couldn't be reset." };
}
