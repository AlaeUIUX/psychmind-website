import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { auditLog, providerProfile, user } from "@/db/schema";
import { reminderDue } from "@/lib/onboarding-reminders";
import { sendEmail } from "@/server/email";
import { optedOutOf } from "@/server/notifications";
import { doOnce } from "@/server/once";
import { appUrl } from "@/server/url";
import { onboardingReminderEmail } from "./emails";

// Abandoned onboarding (slice 4), run by the daily cron: providers with a
// draft profile (started, never submitted), a verified email, and not a
// sample get a reminder 1, 3 and 7 days after they last worked on it. Each
// is sent once, ever: an audit_log row "onboarding.reminder" with { day }.
// Profiles our team sent back for changes get the same rhythm with their own
// wording, once per change request: "onboarding.changes_reminder" with
// { day, round }, where round is when the changes were requested.

const LOOKBACK_DAYS = 14; // the last reminder's window ends here (lib/onboarding-reminders.ts)

export async function sendOnboardingReminders(now = new Date()) {
  await dbReady;
  // Last activity: the profile row, or its locations and licenses (saved separately).
  const lastActivity = sql<Date>`greatest(
    ${providerProfile.updatedAt},
    coalesce((select max(updated_at) from provider_location where profile_id = ${providerProfile.id}), ${providerProfile.updatedAt}),
    coalesce((select max(updated_at) from provider_license where profile_id = ${providerProfile.id}), ${providerProfile.updatedAt})
  )`;
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000);
  const drafts = await db
    .select({ id: providerProfile.id, userId: user.id, email: user.email, status: providerProfile.status, lastActivity })
    .from(providerProfile)
    .innerJoin(user, eq(user.id, providerProfile.userId))
    .where(
      and(
        inArray(providerProfile.status, ["draft", "changes_requested"]),
        eq(providerProfile.isSample, false),
        eq(user.role, "provider"),
        eq(user.emailVerified, true),
        // The same last-activity measure the reminder timing uses.
        sql`${lastActivity} > ${since}`,
      ),
    );
  if (!drafts.length) return { candidates: 0, sent: 0 };

  // When each sent-back profile was last asked for changes (its round).
  const rounds = new Map<string, string>();
  const changed = drafts.filter((d) => d.status === "changes_requested").map((d) => d.id);
  if (changed.length) {
    const requests = await db
      .select({ targetId: auditLog.targetId, at: sql<string>`max(${auditLog.createdAt})` })
      .from(auditLog)
      .where(and(eq(auditLog.action, "provider.request_changes"), inArray(auditLog.targetId, changed)))
      .groupBy(auditLog.targetId);
    for (const r of requests) rounds.set(r.targetId, new Date(r.at).toISOString());
  }

  const history = await db
    .select({ targetId: auditLog.targetId, action: auditLog.action, meta: auditLog.meta })
    .from(auditLog)
    .where(
      and(
        inArray(auditLog.action, ["onboarding.reminder", "onboarding.changes_reminder"]),
        eq(auditLog.targetType, "provider_profile"),
        inArray(
          auditLog.targetId,
          drafts.map((d) => d.id),
        ),
      ),
    );
  // Days already sent: draft reminders for drafts, this round's for sent-back profiles.
  const sentDays = new Map<string, number[]>();
  for (const h of history) {
    const draft = drafts.find((d) => d.id === h.targetId);
    if (!draft) continue;
    const counts =
      draft.status === "changes_requested"
        ? h.action === "onboarding.changes_reminder" && h.meta.round === rounds.get(h.targetId)
        : h.action === "onboarding.reminder";
    if (counts) sentDays.set(h.targetId, [...(sentDays.get(h.targetId) ?? []), Number(h.meta.day)]);
  }

  // Turned off in Settings → Email notifications.
  const optedOut = await optedOutOf("onboarding_reminders", drafts.map((d) => d.userId));
  const [url, settingsUrl] = await Promise.all([appUrl("/provider/onboarding"), appUrl("/provider/settings")]);
  let sent = 0;
  for (const draft of drafts) {
    if (optedOut.has(draft.userId)) continue;
    // Raw SQL results come back as strings on some drivers.
    const day = reminderDue(new Date(draft.lastActivity), now, sentDays.get(draft.id) ?? []);
    if (!day) continue;
    try {
      const changes = draft.status === "changes_requested";
      const round = rounds.get(draft.id) ?? "";
      const didSend = await doOnce(
        changes
          ? { action: "onboarding.changes_reminder", targetType: "provider_profile", targetId: draft.id, meta: { day, round } }
          : { action: "onboarding.reminder", targetType: "provider_profile", targetId: draft.id, meta: { day } },
        () => sendEmail(onboardingReminderEmail(draft.email, day, url, settingsUrl, changes ? "changes" : "draft")),
      );
      if (didSend) sent++;
    } catch (err) {
      console.error("onboarding reminder failed", err);
    }
  }
  return { candidates: drafts.length, sent };
}
