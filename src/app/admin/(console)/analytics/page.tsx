import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/analytics/bar-list";
import { comparedWith, CountTile, Panel } from "@/components/analytics/provider-analytics";
import { AnalyticsFrame } from "@/components/analytics/range-filter";
import { TrendChart } from "@/components/analytics/trend-chart";
import { PageHeader } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCount } from "@/lib/analytics/format";
import { dayOf, parseRange } from "@/lib/analytics/range";
import { directorySnapshot, siteAnalytics } from "@/server/analytics/data";

export const metadata: Metadata = { title: "Analytics — PsychMind admin" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Site-wide monitoring for the team. Every number is a daily count: no
// visitor can be singled out, and nothing here comes from third parties.
// TODO(client): copy (the admin console isn't designed in Figma).

const PAGE_LABELS: Record<string, string> = {
  "view:home": "Home",
  "view:search": "Search results",
  "view:profile": "Provider profiles",
  "view:request": "Request a session",
};

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const today = dayOf();
  const range = parseRange(await searchParams, today);
  const [stats, now] = await Promise.all([siteAnalytics(range), directorySnapshot()]);
  const { current: c, previous: p } = stats;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Admin" }, { label: "Analytics" }]}
        title="Analytics"
        description="How people use PsychMind: visits, searches, profiles and session requests. Daily counts only, with nothing that identifies a visitor."
      />

      <div className="flex flex-col gap-5">
        <Panel title="Right now">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Live providers" value={formatCount(now.live)} info="Real providers patients can find in search today." />
            <StatTile label="Waiting for review" value={formatCount(now.inReview)} info="Profiles submitted for verification." />
            <StatTile label="Patient accounts" value={formatCount(now.patients)} />
            <StatTile label="Sample providers" value={formatCount(now.samples)} info="Demo profiles. Remove them before launch (All providers)." />
          </div>
        </Panel>

        <AnalyticsFrame range={range} today={today}>
          <Panel title="Overview" aside={<p className="type-ui-caption text-text-placeholder">Changes are {comparedWith(range)}</p>}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <CountTile label="Visitors" current={c.visitors} previous={p.visitors} info="Different visitors each day, added up. Browsers that ask not to be tracked aren't counted." />
              <CountTile label="Page views" current={c.pageViews} previous={p.pageViews} info="Home, search results, profiles and request pages." />
              <CountTile label="Searches" current={c.searches} previous={p.searches} info="Searches run on the results page, including filter changes." />
              <CountTile label="Profile views" current={c.views} previous={p.views} info="Quick looks and full profiles, across all providers." />
              <CountTile label="Session requests" current={c.requests} previous={p.requests} info="Requests sent to providers, including demo requests to sample providers." />
              <CountTile label="Sign-ups" current={c.signups} previous={p.signups} info="New patient and provider accounts." />
            </div>
            <p className="type-ui-caption text-text-placeholder">
              {formatCount(stats.signupsByRole.patient)} patient and {formatCount(stats.signupsByRole.provider)} provider sign-ups
              {stats.demoRequests ? `; ${formatCount(stats.demoRequests)} of the requests went to sample providers` : ""}.
            </p>
          </Panel>

          <TrendChart
            series={stats.series}
            metrics={[
              { key: "visitors", label: "Visitors" },
              { key: "pageViews", label: "Page views" },
              { key: "searches", label: "Searches" },
              { key: "impressions", label: "Impressions" },
              { key: "views", label: "Profile views" },
              { key: "requests", label: "Session requests" },
              { key: "saves", label: "Saves" },
              { key: "signups", label: "Sign-ups" },
            ]}
            empty="Nothing yet for these dates."
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Pages" aside={<p className="type-ui-caption text-text-placeholder">Views</p>}>
              <BarList items={stats.pages.map((pg) => ({ label: PAGE_LABELS[pg.key], count: pg.count }))} label="Page views by page" />
            </Panel>
            <Panel title="Top searches" aside={<p className="type-ui-caption text-text-placeholder">Searches</p>}>
              {stats.terms.length ? (
                <BarList items={stats.terms} label="Top searches" />
              ) : (
                <p className="type-ui-small text-text-tertiary">No searches with filters in these dates.</p>
              )}
            </Panel>
          </div>

          <Panel title="Most viewed providers">
            {stats.topProviders.length ? (
              <div className="-mx-4 overflow-x-auto sm:-mx-5">
                <Table className="min-w-[560px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4 sm:pl-5">Provider</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Profile views</TableHead>
                      <TableHead className="text-right">Saves</TableHead>
                      <TableHead className="pr-4 text-right sm:pr-5">Requests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topProviders.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="pl-4 sm:pl-5">
                          <span className="flex items-center gap-2">
                            <Link href={`/admin/providers/${t.id}`} className="font-medium text-text-primary underline-offset-4 hover:underline">
                              {t.name}
                            </Link>
                            {t.isSample && <Badge variant="neutral">Sample</Badge>}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatCount(t.impressions)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCount(t.views)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCount(t.saves)}</TableCell>
                        <TableCell className="pr-4 text-right tabular-nums sm:pr-5">{formatCount(t.requests)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="type-ui-small text-text-tertiary">No profile activity in these dates.</p>
            )}
          </Panel>
        </AnalyticsFrame>
      </div>
    </>
  );
}
