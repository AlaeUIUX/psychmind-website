import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { notificationOptOut } from "@/db/schema";
import { kindsFor, NOTIFICATION_KINDS, type NotificationKind, type NotificationRole } from "@/lib/notifications";
import { marketingOptedOut, setMarketingOptOut } from "./marketing";

// Who turned which optional emails off (lib/notifications.ts). Senders of
// optional email check here first; everything else is always sent.

/** The users among `userIds` who turned `kind` off. */
export async function optedOutOf(kind: Exclude<NotificationKind, "marketing">, userIds: string[]) {
  if (!userIds.length) return new Set<string>();
  await dbReady;
  const rows = await db
    .select({ userId: notificationOptOut.userId })
    .from(notificationOptOut)
    .where(and(eq(notificationOptOut.kind, kind), inArray(notificationOptOut.userId, userIds)));
  return new Set(rows.map((r) => r.userId));
}

export async function wantsEmail(kind: Exclude<NotificationKind, "marketing">, userId: string) {
  return !(await optedOutOf(kind, [userId])).has(userId);
}

export type NotificationSetting = { kind: NotificationKind; label: string; description: string; enabled: boolean };

export async function notificationSettings(user: { id: string; email: string; role: NotificationRole }): Promise<NotificationSetting[]> {
  await dbReady;
  const [off, marketingOff] = await Promise.all([
    db.select({ kind: notificationOptOut.kind }).from(notificationOptOut).where(eq(notificationOptOut.userId, user.id)),
    marketingOptedOut(user.email),
  ]);
  const offKinds = new Set(off.map((r) => r.kind));
  return kindsFor(user.role).map((kind) => ({
    kind,
    label: NOTIFICATION_KINDS[kind].label,
    description: NOTIFICATION_KINDS[kind].description,
    enabled: kind === "marketing" ? !marketingOff : !offKinds.has(kind),
  }));
}

export async function setNotification(user: { id: string; email: string; role: NotificationRole }, kind: NotificationKind, enabled: boolean) {
  if (!kindsFor(user.role).includes(kind)) return false;
  await dbReady;
  if (kind === "marketing") await setMarketingOptOut(user.email, !enabled);
  else if (enabled) await db.delete(notificationOptOut).where(and(eq(notificationOptOut.userId, user.id), eq(notificationOptOut.kind, kind)));
  else await db.insert(notificationOptOut).values({ userId: user.id, kind }).onConflictDoNothing();
  return true;
}
