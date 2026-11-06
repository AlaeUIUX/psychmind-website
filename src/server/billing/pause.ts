import "server-only";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { auditLog, subscription } from "@/db/schema";
import { stripeConfigured } from "@/lib/billing";

// A suspended provider is hidden from search, so they mustn't keep paying.
// Suspending pauses collection on their subscription (Stripe voids the
// invoices it would have sent); unsuspending resumes it. The subscription
// itself stays, so lifting a suspension needs no new checkout, and they can
// still cancel it from Manage billing. Refunds for the period already paid
// are the team's call, in Stripe. Without Stripe there's nothing to do.

const BILLING = ["active", "trialing", "past_due", "unpaid"];

/** Pauses (or resumes) collection on the provider's subscriptions. Returns
 *  false, after logging and auditing, when Stripe refused: the admin is told
 *  to do it in the Stripe dashboard. */
export async function setBillingPaused(userId: string, profileId: string, paused: boolean): Promise<boolean> {
  if (!stripeConfigured()) return true;
  const subs = await db
    .select({ stripeSubscriptionId: subscription.stripeSubscriptionId })
    .from(subscription)
    .where(and(eq(subscription.referenceId, userId), inArray(subscription.status, BILLING), isNotNull(subscription.stripeSubscriptionId)));
  if (!subs.length) return true;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    for (const s of subs) {
      // "" clears pause_collection (Stripe's way to unset a field).
      await stripe.subscriptions.update(s.stripeSubscriptionId!, { pause_collection: paused ? { behavior: "void" } : "" });
    }
    await db.insert(auditLog).values({
      actorId: null,
      action: paused ? "billing.paused" : "billing.resumed",
      targetType: "provider_profile",
      targetId: profileId,
      meta: { subscriptions: subs.length },
    });
    return true;
  } catch (err) {
    console.error(paused ? "pausing billing failed" : "resuming billing failed", err);
    await db.insert(auditLog).values({
      actorId: null,
      action: paused ? "billing.pause_failed" : "billing.resume_failed",
      targetType: "provider_profile",
      targetId: profileId,
      meta: {},
    });
    return false;
  }
}
