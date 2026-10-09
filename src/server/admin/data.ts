import "server-only";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { auditLog, providerLocation, providerProfile, user } from "@/db/schema";
import type { ProviderStatus } from "@/lib/provider/types";
import { listedAdminEmails } from "@/server/auth/admin-emails";
import { requireRole } from "@/server/auth/session";
import { ensureAdminAccounts } from "./accounts";

// Every function here checks for an admin itself. Layouts aren't enough: Next
// can skip re-rendering a layout on client navigation, so a page's data must
// never rely on its layout's check.

export type ProviderRow = {
  id: string;
  name: string;
  email: string;
  status: ProviderStatus;
  needsReview: boolean;
  /** One of the sample providers (Admin → Sample providers). */
  isSample: boolean;
  submittedAt: Date | null;
  states: string[];
};

/** Providers for the admin lists. `queue` = waiting for a decision, oldest first. */
export async function listProviders(filter: "queue" | "all"): Promise<ProviderRow[]> {
  await requireRole("admin");
  await dbReady;
  const where =
    filter === "queue"
      ? or(eq(providerProfile.status, "submitted"), eq(providerProfile.needsReview, true))
      : undefined;
  const rows = await db
    .select({
      id: providerProfile.id,
      firstName: providerProfile.firstName,
      lastName: providerProfile.lastName,
      email: user.email,
      status: providerProfile.status,
      needsReview: providerProfile.needsReview,
      isSample: providerProfile.isSample,
      submittedAt: providerProfile.submittedAt,
    })
    .from(providerProfile)
    .innerJoin(user, eq(user.id, providerProfile.userId))
    .where(where)
    .orderBy(filter === "queue" ? asc(providerProfile.submittedAt) : desc(providerProfile.updatedAt));

  const ids = rows.map((r) => r.id);
  const locations = ids.length
    ? await db.select({ profileId: providerLocation.profileId, state: providerLocation.state }).from(providerLocation).where(inArray(providerLocation.profileId, ids))
    : [];
  return rows.map((r) => ({
    id: r.id,
    name: [r.firstName, r.lastName].filter(Boolean).join(" ") || "(no name yet)",
    email: r.email,
    status: r.status,
    needsReview: r.needsReview,
    isSample: r.isSample,
    submittedAt: r.submittedAt,
    states: locations.filter((l) => l.profileId === r.id).map((l) => l.state),
  }));
}

export async function providerHistory(profileId: string) {
  await requireRole("admin");
  return db
    .select({ action: auditLog.action, meta: auditLog.meta, createdAt: auditLog.createdAt, actor: user.name })
    .from(auditLog)
    .leftJoin(user, eq(user.id, auditLog.actorId))
    .where(and(eq(auditLog.targetType, "provider_profile"), eq(auditLog.targetId, profileId)))
    .orderBy(desc(auditLog.createdAt))
    .limit(50);
}

export async function providerOwnerEmail(profileId: string) {
  await requireRole("admin");
  const [row] = await db
    .select({ email: user.email })
    .from(providerProfile)
    .innerJoin(user, eq(user.id, providerProfile.userId))
    .where(eq(providerProfile.id, profileId));
  return row?.email ?? null;
}

export type AdminRow = {
  email: string;
  account: {
    id: string;
    name: string;
    role: string;
    twoFactorEnabled: boolean | null;
    mustChangePassword: boolean;
    tempPasswordExpiresAt: Date | null;
    createdAt: Date;
  } | null;
};

/** Everyone on ADMIN_EMAILS and how far they are in setting up (Admin → Admins). */
export async function listAdmins(): Promise<AdminRow[]> {
  await requireRole("admin", "/admin/admins");
  // Anyone newly listed gets their account (and email) now.
  await ensureAdminAccounts();
  const emails = listedAdminEmails();
  if (!emails.length) return [];
  await dbReady;
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      mustChangePassword: user.mustChangePassword,
      tempPasswordExpiresAt: user.tempPasswordExpiresAt,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(inArray(user.email, emails));
  const byEmail = new Map(rows.map(({ email, ...rest }) => [email, rest]));
  return emails.map((email) => ({ email, account: byEmail.get(email) ?? null }));
}
