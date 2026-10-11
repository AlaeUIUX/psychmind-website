// Abandoned-onboarding reminders (slice 4): 1, 3 and 7 days after a provider
// last worked on an unsubmitted profile. Pure, so it's unit-tested
// (tests/unit/onboarding-reminders.test.ts); server/onboarding/reminders.ts
// sends them from the daily cron.

export const REMINDER_DAYS = [1, 3, 7] as const;
export type ReminderDay = (typeof REMINDER_DAYS)[number];

const DAY = 86_400_000;
/** Each reminder has a window: day 1 until day 3, day 3 until day 7, day 7
 *  until day 14. A missed run sends only the reminder whose window it is, and
 *  profiles abandoned long ago (or before this shipped) get nothing. */
const WINDOW_END: Record<ReminderDay, number> = { 1: 3, 3: 7, 7: 14 };

/** The reminder due now, if any: the one whose window `now` falls in, unless
 *  it was already sent. `lastActivity` is the profile's last update. */
export function reminderDue(lastActivity: Date, now: Date, sent: readonly number[]): ReminderDay | null {
  const days = (now.getTime() - lastActivity.getTime()) / DAY;
  const day = [...REMINDER_DAYS].reverse().find((d) => days >= d);
  if (!day || days >= WINDOW_END[day] || sent.includes(day)) return null;
  return day;
}
