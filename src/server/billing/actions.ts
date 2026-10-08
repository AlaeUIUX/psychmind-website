"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BASE_PLAN, stripeConfigured } from "@/lib/billing";
import { auth } from "@/server/auth";
import { requireRole } from "@/server/auth/session";
import { ensureProfile } from "@/server/provider/data";
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

export async function startCheckout(): Promise<BillingActionState> {
  const { user } = await requireRole("provider");
  const profile = await ensureProfile(user.id);
  if (profile.status !== "approved") return { error: "You can activate your listing once your profile is verified." };
  const api = stripeApi();
  if (!api) return { error: NOT_CONNECTED };

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
