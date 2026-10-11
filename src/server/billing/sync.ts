import "server-only";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog, providerProfile, user } from "@/db/schema";
import { renewalTerms } from "@/lib/billing";
import { billingNotices, type PreviousBilling } from "@/lib/billing-notices";
import { sendEmail } from "@/server/email";
import { subscriptionStartedEmail } from "@/server/emails";
import { appUrl } from "@/server/url";
import { sendBillingNotices } from "./notices";
import { planPrice } from "./price";

// Called by the Stripe plugin whenever a subscription is created, updated or
// canceled (webhooks). Records when a subscription first went past due, so
// the 3-day grace period (lib/billing.ts) has a start time, and clears it
// once the provider pays. Then sends the billing emails the change calls for
// (payment failed, paused, recovered, cancellation confirmed; notices.ts),
// comparing with the previous state: the last "subscription.*" audit row.
export async function onSubscriptionChange(subscription: {
  referenceId: string;
  status?: string | null;
  id?: string;
  cancelAtPeriodEnd?: boolean | null;
  periodEnd?: Date | null;
  endedAt?: Date | null;
}) {
  const [profile] = await db
    .select({
      id: providerProfile.id,
      userId: providerProfile.userId,
      status: providerProfile.status,
      isSample: providerProfile.isSample,
      pastDueSince: providerProfile.pastDueSince,
    })
    .from(providerProfile)
    .where(eq(providerProfile.userId, subscription.referenceId));
  if (!profile) return;
  const prev = await previousBilling(profile.id, subscription.id, profile.pastDueSince);

  const pastDue = subscription.status === "past_due" || subscription.status === "unpaid";
  const pastDueSince = pastDue ? (profile.pastDueSince ?? new Date()) : null;
  if (pastDueSince?.getTime() !== profile.pastDueSince?.getTime()) {
    await db.update(providerProfile).set({ pastDueSince }).where(eq(providerProfile.id, profile.id));
  }
  await db.insert(auditLog).values({
    actorId: null,
    action: `subscription.${subscription.status ?? "updated"}`,
    targetType: "provider_profile",
    targetId: profile.id,
    meta: {
      subscriptionId: subscription.id ?? null,
      status: subscription.status ?? null,
      cancelAtPeriodEnd: !!subscription.cancelAtPeriodEnd,
    },
  });
  revalidatePath("/provider", "layout");

  // A failed send is logged, never a failed webhook (the cron retries).
  try {
    const notices = billingNotices(profile.status, prev, {
      id: subscription.id ?? profile.id,
      status: subscription.status ?? null,
      cancelAtPeriodEnd: !!subscription.cancelAtPeriodEnd,
      pastDueSince,
      periodEnd: subscription.periodEnd ?? null,
      endedAt: subscription.endedAt ?? null,
    });
    await sendBillingNotices(profile, notices);
  } catch (err) {
    console.error("billing email failed", err);
  }
}

/** The subscription as we last recorded it (null before the first event). */
async function previousBilling(profileId: string, subscriptionId: string | undefined, pastDueSince: Date | null): Promise<PreviousBilling | null> {
  const [last] = await db
    .select({ action: auditLog.action, meta: auditLog.meta })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.targetType, "provider_profile"),
        eq(auditLog.targetId, profileId),
        like(auditLog.action, "subscription.%"),
        subscriptionId ? sql`${auditLog.meta}->>'subscriptionId' = ${subscriptionId}` : undefined,
      ),
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(1);
  if (!last) return pastDueSince ? { status: null, cancelAtPeriodEnd: false, pastDueSince } : null;
  const status = typeof last.meta.status === "string" ? last.meta.status : last.action.slice("subscription.".length);
  return { status, cancelAtPeriodEnd: last.meta.cancelAtPeriodEnd === true, pastDueSince };
}

/** After checkout: the renewal terms they agreed to and how to cancel, by
 *  email (California's automatic renewal law calls this the acknowledgment).
 *  A failed send is logged, never a failed webhook. */
export async function sendSubscriptionConfirmation(userId: string) {
  try {
    const [owner] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId));
    if (!owner) return;
    const terms = renewalTerms(await planPrice());
    await sendEmail(subscriptionStartedEmail(owner.email, terms, await appUrl("/provider/billing")));
  } catch (err) {
    console.error("subscription confirmation email failed", err);
  }
}
