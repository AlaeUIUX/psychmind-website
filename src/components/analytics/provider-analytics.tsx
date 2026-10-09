import { cn } from "cn";
import { ClockIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import { LocalTime } from "@/components/app/local-time";
import { StatTile } from "@/components/app/stat-tile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { conversionRate, formatChange, formatCount, formatPercent, rateChange } from "@/lib/analytics/format";
import type { DayRange } from "@/lib/analytics/range";
import { formatLabel, sessionTypeLabel } from "@/lib/requests";
import { TERM_THRESHOLD, type ProviderAnalytics } from "@/server/analytics/data";
import { BarList } from "./bar-list";
import { TrendChart } from "./trend-chart";

// The provider's numbers (Figma D1, below the time filter): Overview tiles,
// the trend chart, "How patients found you" and recent session requests.
// TODO(client): copy not in Figma (definitions, comparison note, empty states).

/** A dashboard card: a titled region with an optional note on the right. */
export function Panel({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <Card role="region" aria-labelledby={id} className={cn("gap-4 py-4 sm:py-5", className)}>
      <CardHeader className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 sm:px-5">
        <h2 id={id} className="type-ui-heading text-text-primary">
          {title}
        </h2>
        {aside}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 px-4 sm:px-5">{children}</CardContent>
    </Card>
  );
}

export function comparedWith(range: DayRange) {
  return `vs the previous ${range.days === 1 ? "day" : `${range.days} days`}`;
}

/** A count tile with its change against the previous period. */
export function CountTile({ label, current, previous, info }: { label: string; current: number; previous: number; info: string }) {
  const change = current - previous;
  return <StatTile label={label} value={formatCount(current)} delta={change} deltaLabel={formatChange(change)} info={info} />;
}

export function ProviderAnalyticsView({ stats, range }: { stats: ProviderAnalytics; range: DayRange }) {
  const { current: c, previous: p } = stats;
  const rate = conversionRate(c.requests, c.views);
  const rateDelta = rateChange(rate, conversionRate(p.requests, p.views));

  return (
    <>
      <Panel title="Overview" aside={<p className="type-ui-caption text-text-placeholder">Changes are {comparedWith(range)}</p>}>
        <StatTile
          hero
          label="Conversion rate"
          value={formatPercent(rate)}
          delta={rateDelta?.value}
          deltaLabel={rateDelta?.label}
          info="Session requests for every 100 profile views."
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CountTile label="Impressions" current={c.impressions} previous={p.impressions} info="Times your profile appeared in search results." />
          <CountTile label="Profile views" current={c.views} previous={p.views} info="Times patients opened your profile, in a quick look or in full." />
          <CountTile label="Session requests" current={c.requests} previous={p.requests} info="Requests patients sent you through PsychMind." />
          <CountTile label="Saves" current={c.saves} previous={p.saves} info="Times patients saved your profile to come back to." />
        </div>
      </Panel>

      <TrendChart
        series={stats.series}
        metrics={[
          { key: "impressions", label: "Impressions" },
          { key: "views", label: "Profile views" },
          { key: "requests", label: "Session requests" },
          { key: "saves", label: "Saves" },
        ]}
        empty="Nothing yet for these dates."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="How patients found you" aside={<p className="type-ui-caption text-text-placeholder">Top search terms</p>}>
          {stats.terms.length ? (
            <BarList items={stats.terms} label="Top search terms" />
          ) : (
            <p className="type-ui-small text-text-tertiary">
              A search appears here once it has shown your profile {TERM_THRESHOLD} times in the dates you picked.
            </p>
          )}
          {/* Figma's footnotes, verbatim. */}
          <ul className="mt-auto flex flex-col gap-2 border-t border-warm-200 pt-4 type-ui-caption text-text-tertiary">
            <li className="flex items-center gap-2">
              <ClockIcon aria-hidden className="size-3.5 shrink-0" />
              Search results are updated everyday
            </li>
            <li className="flex items-center gap-2">
              <SparklesIcon aria-hidden className="size-3.5 shrink-0" />
              This visual helps optimizing for keywords
            </li>
          </ul>
        </Panel>

        <Panel
          title="Recent session requests"
          aside={
            <Link href="/provider/requests" className="type-ui-caption text-text-placeholder underline-offset-4 transition-colors hover:text-text-primary hover:underline">
              {formatCount(c.requests)} total
            </Link>
          }
        >
          {stats.recent.length ? (
            <ul className="-mx-2 flex flex-col">
              {stats.recent.map((r) => (
                <li key={r.id}>
                  <Link href="/provider/requests" className="flex items-center gap-3 rounded-field px-2 py-2.5 transition-colors hover:bg-warm-50">
                    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warm-100 type-ui-label text-text-secondary">
                      {r.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate type-ui-label text-text-primary">{r.name}</span>
                      <span className="truncate type-ui-caption text-text-tertiary">
                        {sessionTypeLabel(r.sessionType)} · {formatLabel(r.format)}
                      </span>
                    </span>
                    <LocalTime value={r.createdAt} style="day" className="shrink-0 type-ui-caption text-text-placeholder" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-ui-small text-text-tertiary">No session requests in these dates. New ones also arrive by email.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
