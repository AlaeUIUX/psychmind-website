"use client";

import { cn } from "cn";
import { CircleCheckIcon, CircleDotIcon, CircleIcon } from "@/components/ui/hugeicons";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { OWNER_LABEL, groupProgress, type ItemStatus, type TrackerGroup, type TrackerItem } from "./tracker";

type View = "left" | "client" | "accounts" | "built" | "all";

const VIEWS: { value: View; label: string; empty: string; test: (i: TrackerItem) => boolean }[] = [
  { value: "left", label: "What's left", empty: "Nothing left here.", test: (i) => i.status !== "done" },
  { value: "client", label: "Waiting on the client", empty: "Nothing waiting on the client here.", test: (i) => i.status !== "done" && i.owner === "client" },
  { value: "accounts", label: "Accounts to set up", empty: "No accounts needed here.", test: (i) => i.status !== "done" && i.owner === "accounts" },
  { value: "built", label: "Built", empty: "Nothing built here yet.", test: (i) => i.status === "done" },
  { value: "all", label: "Everything", empty: "", test: () => true },
];

const RANK: Record<ItemStatus, number> = { doing: 0, todo: 1, done: 2 };

/** A progress bar in the portal accent (blue-600) on a zinc track. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  return <Progress value={value} aria-label={label} className="h-1.5 bg-warm-200 [&>[data-slot=progress-indicator]]:bg-blue-600" />;
}

// The tracker list with its view switch. Items keep the tracker's order within
// a status; work in progress comes first.
export function ProgressBoard({ groups }: { groups: TrackerGroup[] }) {
  const [view, setView] = useState<View>("left");
  const current = VIEWS.find((v) => v.value === view)!;
  const count = (v: (typeof VIEWS)[number]) => groups.reduce((n, g) => n + g.items.filter(v.test).length, 0);

  return (
    <section aria-labelledby="board-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 id="board-title" className="type-ui-heading text-text-primary">
          Work
        </h2>
        <ToggleGroup
          type="single"
          variant="chip"
          size="chip"
          spacing={2}
          aria-label="Show"
          value={view}
          onValueChange={(v) => v && setView(v as View)}
          className="flex-wrap"
        >
          {VIEWS.map((v) => (
            <ToggleGroupItem key={v.value} value={v.value} className="gap-1.5">
              {v.label}
              <span className="tabular-nums opacity-60">{count(v)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {groups.map((group) => {
        const items = group.items.filter(current.test).sort((a, b) => RANK[a.status] - RANK[b.status]);
        const p = groupProgress(group.items);
        return (
          <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className="scroll-mt-6 overflow-hidden rounded-card border border-warm-200 bg-white">
            <header className="flex flex-col gap-2 border-b border-warm-200 bg-warm-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex flex-col">
                <span className="type-ui-caption text-text-tertiary">
                  {group.label}
                  {group.amount ? ` · $${group.amount.toLocaleString("en-US")}` : ""}
                </span>
                <h3 id={`${group.id}-title`} className="type-ui-heading text-text-primary">
                  {group.title}
                </h3>
              </div>
              {group.amount ? (
                <div className="flex items-center gap-3 sm:w-56">
                  <ProgressBar value={p.percent} label={`${group.label} progress`} />
                  <span className="type-ui-caption w-9 shrink-0 text-right text-text-tertiary tabular-nums">{p.percent}%</span>
                </div>
              ) : null}
            </header>
            {items.length ? (
              <ul className="flex flex-col divide-y divide-warm-100">
                {items.map((item) => (
                  <Row key={item.title} item={item} />
                ))}
              </ul>
            ) : (
              <p className="type-ui-small px-4 py-4 text-text-placeholder sm:px-5">{current.empty}</p>
            )}
          </section>
        );
      })}
    </section>
  );
}

const STATUS = {
  done: { Icon: CircleCheckIcon, className: "text-emerald-600", label: "Done" },
  doing: { Icon: CircleDotIcon, className: "text-blue-600", label: "In progress" },
  todo: { Icon: CircleIcon, className: "text-warm-300", label: "To do" },
} as const;

const OWNER_VARIANT = { build: "neutral", client: "warning", accounts: "info" } as const;

function Row({ item }: { item: TrackerItem }) {
  const status = STATUS[item.status];
  // Plain routes link to the page; paths with placeholders or query strings are just labels.
  const route = item.where?.startsWith("/") && !/[{?]/.test(item.where) ? item.where : null;
  return (
    <li className="flex gap-3 px-4 py-3 transition-colors hover:bg-warm-50 sm:px-5">
      <status.Icon aria-label={status.label} className={cn("mt-0.5 size-4 shrink-0", status.className)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={cn("type-ui-label", item.status === "done" ? "text-text-secondary" : "text-text-primary")}>{item.title}</p>
          {item.status === "doing" && <Badge variant="info">In progress</Badge>}
          {item.owner !== "build" && <Badge variant={OWNER_VARIANT[item.owner]}>{OWNER_LABEL[item.owner]}</Badge>}
        </div>
        {item.detail && <p className="type-ui-small max-w-[75ch] text-text-tertiary">{item.detail}</p>}
        {item.where &&
          (route ? (
            <a href={route} target="_blank" rel="noreferrer" className="type-ui-mono w-fit text-text-placeholder underline-offset-2 hover:text-text-primary hover:underline">
              {item.where}
            </a>
          ) : (
            <span className="type-ui-mono break-all text-text-placeholder">{item.where}</span>
          ))}
      </div>
    </li>
  );
}
