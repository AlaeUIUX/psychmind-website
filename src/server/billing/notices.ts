import "server-only";
import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, dbReady } from "@/db";
import { providerProfile, subscription, user } from "@/db/schema";
import { billingNotices, type BillingNotice } from "@/lib/billing-notices";
import type { ProviderStatus } from "@/lib/provider/types";
import { sendEmail } from "@/server/email";
import { doOnce } from "@/server/once";
import { appUrl } from "@/server/url";
import {
  cancellationConfirmedEmail,
  paymentFailedEmail,
  paymentRecoveredEmail,
  profilePausedEmail,
} from "./emails";

// Sends the billing emails lib/billing-notices.ts asks for, each once ever
// (an audit_log row "billing.email" with the notice's key). Called from the
// Stripe webhooks (sync.ts) and the daily cron, which also catches the end
// of the 3-day grace period (no webhook fires then) and any missed webhook.

const RANKED = ["active", "trialing", "past_due", "unpaid", "paused"];
const rank = (s: string | null) => (RANKED.includes(s ?? "") ? RANKED.indexOf(s ?? "") : 99);

type Profile = { id: string; userId: string; status: ProviderStatus; isSample: boolean };

/** Sends each notice not sent before. Returns how many went out now. */
export async function sendBillingNotices(profile: Profile, notices: BillingNotice[], now = new Date()) {
  if (profile.isSample || !notices.length) return 0; // samples are never emailed
  const [owner] = await db.select({ email: user.email }).from(user).where(eq(user.id, profile.userId));
  if (!owner) return 0;
  const billingUrl = await appUrl("/provider/billing");
  let sent = 0;
  for (const notice of notices) {
    const email = {
      payment_failed: () => paymentFailedEmail(owner.email, billingUrl),
      paused: () => profilePausedEmail(owner.email, billingUrl),
      recovered: () => paymentRecoveredEmail(owner.email, billingUrl),
      cancel_confirmed: () => cancellationConfirmedEmail(owner.email, notice.endsAt ?? now, billingUrl, now),
    }[notice.kind]();
    const didSend = await doOnce(
      { action: "billing.email", targetType: "provider_profile", targetId: profile.id, meta: { key: notice.key, kind: notice.kind } },
      () => sendEmail(email),
    );
    if (didSend) sent++;
  }
  return sent;
}

/** The cron's double-check: for every provider with a failing subscription or
 *  a past-due mark, re-derive the mark from their subscription and send what's
 *  due (mostly "profile paused" once the grace period is over). */
export async function sweepBilling(now = new Date()) {
  await dbReady;
  const failing = db
    .select({ referenceId: subscription.referenceId })
    .from(subscription)
    .where(inArray(subscription.status, ["past_due", "unpaid", "paused"]));
  const profiles = await db
    .select({
      id: providerProfile.id,
      userId: providerProfile.userId,
      status: providerProfile.status,
      isSample: providerProfile.isSample,
      pastDueSince: providerProfile.pastDueSince,
    })
    .from(providerProfile)
    .where(
      and(
        eq(providerProfile.isSample, false),
        or(isNotNull(providerProfile.pastDueSince), inArray(providerProfile.userId, failing)),
      ),
    );

  let checked = 0;
  let corrected = 0;
  let emailed = 0;
  for (const profile of profiles) {
    checked++;
    // The same subscription loadBilling() shows: a live one over old canceled ones.
    const subs = await db.select().from(subscription).where(eq(subscription.referenceId, profile.userId));
    const sub = subs.sort((a, b) => rank(a.status) - rank(b.status))[0];
    const billing = {
      status: sub?.status ?? null,
      cancelAtPeriodEnd: !!sub?.cancelAtPeriodEnd,
      periodEnd: sub?.periodEnd ?? null,
    };
    const isFailing = billing.status === "past_due" || billing.status === "unpaid";
    const pastDueSince = isFailing ? (profile.pastDueSince ?? now) : null;
    if (pastDueSince?.getTime() !== profile.pastDueSince?.getTime()) {
      await db.update(providerProfile).set({ pastDueSince }).where(eq(providerProfile.id, profile.id));
      corrected++;
    }
    const notices = billingNotices(
      profile.status,
      { status: null, cancelAtPeriodEnd: billing.cancelAtPeriodEnd, pastDueSince: profile.pastDueSince },
      {
        id: sub?.id ?? profile.id,
        status: billing.status,
        cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
        pastDueSince,
        periodEnd: billing.periodEnd,
        endedAt: sub?.endedAt ?? null,
      },
      now,
    ).filter((n) => n.kind !== "cancel_confirmed"); // only the webhook confirms a cancellation
    emailed += await sendBillingNotices(profile, notices, now);
  }
  if (corrected) revalidatePath("/provider", "layout");
  return { checked, corrected, emailed };
}
