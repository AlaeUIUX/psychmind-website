import "server-only";
import Stripe from "stripe";
import { BASE_PLAN, stripeConfigured, type PlanPrice } from "@/lib/billing";

// The renewal terms must quote what Stripe will actually charge, so the price
// comes from the Stripe price on STRIPE_PRICE_BASE, not BASE_PLAN.priceLabel
// (Figma's copy). Cached for 10 minutes per server instance.

let cached: { at: number; price: PlanPrice } | null = null;
const TTL = 10 * 60_000;
const FALLBACK: PlanPrice = { amount: BASE_PLAN.priceLabel, interval: "month" };

export async function planPrice(): Promise<PlanPrice> {
  if (!stripeConfigured()) return FALLBACK;
  if (cached && Date.now() - cached.at < TTL) return cached.price;
  try {
    const price = await new Stripe(process.env.STRIPE_SECRET_KEY!).prices.retrieve(process.env.STRIPE_PRICE_BASE!);
    if (price.unit_amount == null || !price.recurring) throw new Error("STRIPE_PRICE_BASE isn't a recurring fixed price.");
    const amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency.toUpperCase(),
      minimumFractionDigits: price.unit_amount % 100 === 0 ? 0 : 2,
    }).format(price.unit_amount / 100);
    const n = price.recurring.interval_count;
    if (n !== 1) throw new Error("Renewal terms only describe one-interval prices; update lib/billing.ts renewalTerms.");
    const interval = price.recurring.interval;
    if (!["day", "week", "month", "year"].includes(interval)) throw new Error(`Unexpected Stripe interval: ${interval}`);
    const result: PlanPrice = { amount, interval: interval as PlanPrice["interval"] };
    cached = { at: Date.now(), price: result };
    return result;
  } catch (err) {
    console.error("couldn't read the Stripe price", err);
    throw err;
  }
}
