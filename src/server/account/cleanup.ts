import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { auditLog, providerProfile, subscription, upload } from "@/db/schema";
import { stripeConfigured } from "@/lib/billing";
import { forgetProviderAnalytics } from "@/server/analytics/forget";
import { deleteFile } from "@/server/storage";

// What has to happen outside the database cascade when someone deletes their
// account. The user row's foreign keys remove sessions, sign-in methods, the
// provider profile (with its locations and licenses) and upload records.

const LIVE_STATUSES = ["active", "trialing", "past_due", "incomplete", "unpaid"];

/** Before the user row is deleted. Throws (and so stops the deletion) if a
 *  paid subscription can't be cancelled — nobody should be billed for an
 *  account that no longer exists. */
export async function beforeAccountDeleted(userId: string) {
  const subs = await db
    .select({ id: subscription.id, stripeSubscriptionId: subscription.stripeSubscriptionId })
    .from(subscription)
    .where(and(eq(subscription.referenceId, userId), inArray(subscription.status, LIVE_STATUSES)));
  if (subs.length && stripeConfigured()) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    for (const s of subs) if (s.stripeSubscriptionId) await stripe.subscriptions.cancel(s.stripeSubscriptionId);
  }
  await db.delete(subscription).where(eq(subscription.referenceId, userId));

  // File bytes live outside the upload table (disk or file_blob).
  const files = await db.select({ storageKey: upload.storageKey }).from(upload).where(eq(upload.ownerId, userId));
  for (const f of files) await deleteFile(f.storageKey);

  // Analytics rows aren't tied to the profile by a foreign key.
  const profiles = await db.select({ id: providerProfile.id }).from(providerProfile).where(eq(providerProfile.userId, userId));
  await forgetProviderAnalytics(profiles.map((p) => p.id));
}

/** After deletion: a record that it happened, with no personal details. */
export async function afterAccountDeleted(userId: string, role: string | undefined) {
  await db.insert(auditLog).values({ actorId: null, action: "account_deleted", targetType: "user", targetId: userId, meta: { role: role ?? null } });
}
