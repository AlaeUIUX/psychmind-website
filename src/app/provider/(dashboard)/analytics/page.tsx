import type { Metadata } from "next";
import Link from "next/link";
import { ProviderAnalyticsView } from "@/components/analytics/provider-analytics";
import { AnalyticsFrame } from "@/components/analytics/range-filter";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ChartLineIcon } from "@/components/ui/hugeicons";
import { dayOf, parseRange } from "@/lib/analytics/range";
import { providerAnalytics } from "@/server/analytics/data";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";

export const metadata: Metadata = { title: "Analytics — PsychMind" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// How the profile is doing in search (Figma D1 "Analytics"): one date filter
// over everything, with deltas against the days just before. Approved
// providers have been (or are) in search, so they have numbers; before that
// the page says when they'll start.
export default async function ProviderAnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { user } = await requireRole("provider", "/provider/analytics");
  const state = await loadProviderState(user.id);
  const today = dayOf();
  const range = parseRange(params, today);
  const stats = state.status === "approved" ? await providerAnalytics(range) : null;

  return (
    <>
      <PageHeader title="Analytics" description="Track your performance on PsychMind, and use insights to generate more leads." />
      {stats ? (
        <AnalyticsFrame range={range} today={today}>
          <ProviderAnalyticsView stats={stats} range={range} />
        </AnalyticsFrame>
      ) : (
        // TODO(client): copy.
        <EmptyState
          art={<ChartLineIcon />}
          title="Your numbers start once you're listed"
          action={
            <Button asChild variant="secondary">
              <Link href="/provider">See what&apos;s left</Link>
            </Button>
          }
        >
          Views, saves and session requests appear here as soon as patients can find you in search.
        </EmptyState>
      )}
    </>
  );
}
