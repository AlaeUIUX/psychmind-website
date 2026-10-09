"use client";

import { ChartLineIcon, TableIcon } from "lucide-react";
import { useId, useState, useSyncExternalStore } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCount } from "@/lib/analytics/format";
import { dayLabel } from "@/lib/analytics/range";

// One metric over the chosen days (Figma D1's trend card: a line with a
// soft area wash, picked from a dropdown). A single series, so the dropdown
// names it and there's no legend. Hovering or focusing the chart shows the
// day's value; the table view lists every day.

type Point = { day: string } & Record<string, number | string>;

const REDUCED = "(prefers-reduced-motion: reduce)";
/** No drawing-in animation for people who ask for less motion. */
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = matchMedia(REDUCED);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => matchMedia(REDUCED).matches,
    () => true,
  );
}
export type TrendMetric = { key: string; label: string };

export function TrendChart({ series, metrics, empty }: { series: Point[]; metrics: TrendMetric[]; empty: string }) {
  const [metric, setMetric] = useState(metrics[0].key);
  const [view, setView] = useState<"chart" | "table">("chart");
  const id = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const current = metrics.find((m) => m.key === metric) ?? metrics[0];
  const total = series.reduce((sum, p) => sum + Number(p[current.key] ?? 0), 0);
  const config = { [current.key]: { label: current.label, color: "var(--chart-1)" } } satisfies ChartConfig;
  // Dots help on a week; on longer ranges they'd crowd the line.
  const dots = series.length <= 14;

  return (
    <Card role="region" aria-labelledby={`${id}-title`} className="gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="sr-only">
          {current.label} per day
        </h2>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger aria-label="Metric" className="w-auto min-w-40 bg-white font-medium">
            {/* The label up front, so the first paint (before hydration) isn't blank. */}
            <SelectValue>{current.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {metrics.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as typeof view)}
          aria-label="Show as"
          className="gap-0.5 rounded-field bg-warm-100 p-0.5 ring-1 ring-warm-200 ring-inset"
        >
          <ToggleGroupItem value="chart" aria-label="Chart" className={toggle}>
            <ChartLineIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table" className={toggle}>
            <TableIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "chart" ? (
        <figure className="relative m-0">
          <figcaption className="sr-only">
            {current.label} per day, {dayLabel(series[0]?.day ?? "")} to {dayLabel(series.at(-1)?.day ?? "")}: {formatCount(total)} in total.
          </figcaption>
          <ChartContainer config={config} className="aspect-auto h-64 w-full [&_.recharts-cartesian-axis-tick_text]:tabular-nums">
            <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`var(--color-${current.key})`} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={`var(--color-${current.key})`} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--warm-200)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={(d: string) => dayLabel(d)} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} tickFormatter={(n: number) => formatCount(n)} />
              <ChartTooltip
                cursor={{ stroke: "var(--warm-300)", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(_, payload) => dayLabel(String(payload?.[0]?.payload?.day ?? ""), true)}
                  />
                }
              />
              <Area
                dataKey={current.key}
                type="monotone"
                stroke={`var(--color-${current.key})`}
                strokeWidth={2}
                fill={`url(#${id}-wash)`}
                dot={dots ? { r: 4, strokeWidth: 2, stroke: "#fff", fill: `var(--color-${current.key})` } : false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                isAnimationActive={!reduced}
                animationDuration={500}
              />
            </AreaChart>
          </ChartContainer>
          {total === 0 && (
            <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center type-ui-small text-text-tertiary">{empty}</p>
          )}
        </figure>
      ) : (
        <div className="h-64 overflow-y-auto rounded-field border border-warm-200">
          <Table>
            <TableHeader className="sticky top-0 bg-warm-50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">{current.label}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...series].reverse().map((p) => (
                <TableRow key={p.day}>
                  <TableCell>{dayLabel(p.day, true)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(Number(p[current.key] ?? 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

const toggle =
  "size-7 min-w-7 rounded-[calc(var(--radius-field)-2px)] p-0 text-text-tertiary hover:bg-white/60 hover:text-text-primary data-[state=on]:bg-white data-[state=on]:text-text-primary data-[state=on]:shadow-control [&_svg]:size-3.5";
