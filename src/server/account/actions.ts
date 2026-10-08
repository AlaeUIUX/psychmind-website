"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { auth } from "@/server/auth";
import { getSession } from "@/server/auth/session";

// Deleting your own account. Better Auth checks the password and runs the
// cleanup in server/account/cleanup.ts (cancel billing, delete files) before
// the user row and everything attached to it is removed. Copy: TODO(client).

export type DeleteAccountState = { error?: string } | null;

export async function deleteAccount(_prev: DeleteAccountState, form: FormData): Promise<DeleteAccountState> {
  const session = await getSession();
  if (!session) redirect("/login");
  const password = String(form.get("password") ?? "");
  const hasPassword = form.get("hasPassword") === "1";
  if (hasPassword && !password) return { error: "Enter your password to delete your account." };
  if (!hasPassword && String(form.get("confirm") ?? "").trim() !== "DELETE") return { error: "Type DELETE to confirm." };

  const ip = clientIp(await headers());
  if (!(await rateLimit("account-delete", `${ip}:${session.user.id}`, 5, "10 m")).ok) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }
  try {
    await auth.api.deleteUser({ body: hasPassword ? { password } : {}, headers: await headers() });
  } catch (err) {
    const code = err instanceof APIError ? (err.body as { code?: string } | undefined)?.code : undefined;
    if (code === "INVALID_PASSWORD") return { error: "That password isn't right." };
    if (code === "SESSION_EXPIRED") return { error: "For your security, log out and back in, then delete your account." };
    if (err instanceof APIError && err.message) return { error: err.message };
    console.error("account deletion failed", err);
    return { error: "We couldn't delete your account. Please try again or contact us." };
  }
  redirect("/login?deleted=1");
}
