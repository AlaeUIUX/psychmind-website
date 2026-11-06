import "server-only";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { graceDaysLeft, liveAgain, listingState, shownListing, type ListingEvent, type ListingState } from "@/lib/billing";
import type { ProviderState } from "@/lib/provider/state";
import { loadBilling } from "./data";

export type ProviderOverview = {
  listing: ListingState;
  graceDays: number;
  billing: Awaited<ReturnType<typeof loadBilling>>;
  /** Back in search after a suspension or a failed payment, for a few days. */
  liveAgain: boolean;
};

/** Listing visibility + billing for a provider's dashboard. */
export async function providerOverview(userId: string, state: ProviderState, pastDueSince: Date | null): Promise<ProviderOverview> {
  const [billing, last] = await Promise.all([loadBilling(userId, pastDueSince), lastListingEvent(state.id)]);
  const listing = listingState(state.status, billing);
  return {
    listing,
    graceDays: graceDaysLeft(pastDueSince),
    billing,
    // As the provider is told it: until payments are connected, approval lists them.
    liveAgain: liveAgain(shownListing(listing), last),
  };
}

/** The latest suspend or unsuspend, or billing email about a failed payment
 *  or its recovery (server/billing/notices.ts records each one it sends). */
async function lastListingEvent(profileId: string): Promise<ListingEvent | null> {
  const [row] = await db
    .select({ action: auditLog.action, kind: sql<string | null>`${auditLog.meta} ->> 'kind'`, at: auditLog.createdAt })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.targetType, "provider_profile"),
        eq(auditLog.targetId, profileId),
        or(
          inArray(auditLog.action, ["provider.suspend", "provider.unsuspend"]),
          and(eq(auditLog.action, "billing.email"), sql`${auditLog.meta} ->> 'kind' in ('payment_failed', 'paused', 'recovered')`),
        ),
      ),
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(1);
  if (!row) return null;
  const back = row.action === "provider.unsuspend" || row.kind === "recovered";
  return { kind: back ? "back" : "down", at: row.at };
}
