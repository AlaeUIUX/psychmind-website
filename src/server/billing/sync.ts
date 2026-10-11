import "server-only";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog, providerProfile, user } from "@/db/schema";
import { renewalTerms } from "@/lib/billing";
import { sendEmail } from "@/server/email";
import { subscriptionStartedEmail } from "@/server/emails";
import { appUrl } from "@/server/url";
import { planPrice } from "./price";

// Called by the Stripe plugin whenever a subscription is created, updated or
// canceled (webhooks). Records when a subscription first went past due, so
// the 3-day grace period (lib/billing.ts) has a start time, and clears it
// once the provider pays.
export async function onSubscriptionChange(subscription: { referenceId: string; status?: string | null; id?: string }) {
  const [profile] = await db
    .select({ id: providerProfile.id, pastDueSince: providerProfile.pastDueSince })
    .from(providerProfile)
    .where(eq(providerProfile.userId, subscription.referenceId));
  if (!profile) return;

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
    meta: { subscriptionId: subscription.id ?? null },
  });
  revalidatePath("/provider", "layout");
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
