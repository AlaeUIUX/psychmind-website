"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { BASE_PLAN, RENEWAL_TERMS_VERSION, renewalTerms, stripeConfigured } from "@/lib/billing";
import { auth } from "@/server/auth";
import { requireRole } from "@/server/auth/session";
import { ensureProfile } from "@/server/provider/data";
import { planPrice } from "./price";
import { appUrl } from "@/server/url";

// Billing for providers, via the Better Auth Stripe plugin. Payment is only
// taken once the admin has verified the provider (build plan D8). Card
// details never touch our servers: Stripe Checkout and the Stripe Customer
// Portal are hosted by Stripe.

export type BillingActionState = { error?: string } | null;

const NOT_CONNECTED = "Payments aren't connected yet. We'll let you know as soon as you can activate your listing.";

type StripeApi = {
  upgradeSubscription: (args: unknown) => Promise<{ url?: string | null }>;
  createBillingPortal: (args: unknown) => Promise<{ url?: string | null }>;
};

/** The Stripe endpoints exist only when the plugin is loaded (keys present). */
function stripeApi(): StripeApi | null {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) return null;
  return auth.api as unknown as StripeApi;
}

export async function startCheckout(_prev: BillingActionState, form: FormData): Promise<BillingActionState> {
  const { user } = await requireRole("provider");
  const profile = await ensureProfile(user.id);
  if (profile.status !== "approved") return { error: "You can activate your listing once your profile is verified." };
  const api = stripeApi();
  if (!api) return { error: NOT_CONNECTED };
  // Automatic renewal needs its own, express consent (lib/billing.ts). TODO(client): copy.
  if (form.get("renewalConsent") !== "on") return { error: "Check the box to agree to automatic renewal before you continue." };
  let terms: string;
  try {
    terms = renewalTerms(await planPrice());
  } catch {
    return { error: "We couldn't start checkout. Please try again." };
  }
  // The record of what they agreed to, and when. Checkout repeats the terms
  // above Stripe's Subscribe button (getCheckoutSessionParams in server/auth).
  await db.insert(auditLog).values({
    actorId: user.id,
    action: "billing.renewal_terms_accepted",
    targetType: "provider_profile",
    targetId: profile.id,
    meta: { version: RENEWAL_TERMS_VERSION, terms },
  });

  let url: string | null | undefined;
  try {
    const result = await api.upgradeSubscription({
      body: {
        plan: BASE_PLAN.name,
        referenceId: user.id,
        successUrl: await appUrl("/provider/billing?checkout=success"),
        cancelUrl: await appUrl("/provider/billing?checkout=cancelled"),
        disableRedirect: true,
      },
      headers: await headers(),
    });
    url = result.url;
  } catch (err) {
    console.error("checkout failed", err);
    return { error: "We couldn't start checkout. Please try again." };
  }
  if (!url) return { error: "We couldn't start checkout. Please try again." };
  redirect(url);
}

export async function openBillingPortal(): Promise<BillingActionState> {
  const { user } = await requireRole("provider");
  const api = stripeApi();
  if (!api) return { error: NOT_CONNECTED };

  let url: string | null | undefined;
  try {
    const result = await api.createBillingPortal({
      body: { referenceId: user.id, returnUrl: await appUrl("/provider/billing"), disableRedirect: true },
      headers: await headers(),
    });
    url = result.url;
  } catch (err) {
    console.error("billing portal failed", err);
    return { error: "We couldn't open billing. Please try again." };
  }
  if (!url) return { error: "We couldn't open billing. Please try again." };
  redirect(url);
}
