import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { auditLog, providerProfile, user } from "@/db/schema";
import { reminderDue } from "@/lib/onboarding-reminders";
import { sendEmail } from "@/server/email";
import { doOnce } from "@/server/once";
import { appUrl } from "@/server/url";
import { onboardingReminderEmail } from "./emails";

// Abandoned onboarding (slice 4), run by the daily cron: providers with a
// draft profile (started, never submitted), a verified email, and not a
// sample get a reminder 1, 3 and 7 days after they last worked on it. Each
// is sent once, ever: an audit_log row "onboarding.reminder" with { day }.

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
    .select({ id: providerProfile.id, email: user.email, lastActivity })
    .from(providerProfile)
    .innerJoin(user, eq(user.id, providerProfile.userId))
    .where(
      and(
        eq(providerProfile.status, "draft"),
        eq(providerProfile.isSample, false),
        eq(user.role, "provider"),
        eq(user.emailVerified, true),
        sql`${providerProfile.updatedAt} > ${since}`,
      ),
    );
  if (!drafts.length) return { candidates: 0, sent: 0 };

  const history = await db
    .select({ targetId: auditLog.targetId, meta: auditLog.meta })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.action, "onboarding.reminder"),
        eq(auditLog.targetType, "provider_profile"),
        inArray(
          auditLog.targetId,
          drafts.map((d) => d.id),
        ),
      ),
    );
  const sentDays = new Map<string, number[]>();
  for (const h of history) sentDays.set(h.targetId, [...(sentDays.get(h.targetId) ?? []), Number(h.meta.day)]);

  const url = await appUrl("/provider/onboarding");
  let sent = 0;
  for (const draft of drafts) {
    // Raw SQL results come back as strings on some drivers.
    const day = reminderDue(new Date(draft.lastActivity), now, sentDays.get(draft.id) ?? []);
    if (!day) continue;
    try {
      const didSend = await doOnce(
        { action: "onboarding.reminder", targetType: "provider_profile", targetId: draft.id, meta: { day } },
        () => sendEmail(onboardingReminderEmail(draft.email, day, url)),
      );
      if (didSend) sent++;
    } catch (err) {
      console.error("onboarding reminder failed", err);
    }
  }
  return { candidates: drafts.length, sent };
}
