import "server-only";
import { graceDaysLeft, listingState, type ListingState } from "@/lib/billing";
import type { ProviderState } from "@/lib/provider/state";
import { loadBilling } from "./data";

export type ProviderOverview = {
  listing: ListingState;
  graceDays: number;
  billing: Awaited<ReturnType<typeof loadBilling>>;
};

/** Listing visibility + billing for a provider's dashboard. */
export async function providerOverview(userId: string, state: ProviderState, pastDueSince: Date | null): Promise<ProviderOverview> {
  const billing = await loadBilling(userId, pastDueSince);
  return {
    listing: listingState(state.status, billing),
    graceDays: graceDaysLeft(pastDueSince),
    billing,
  };
}
