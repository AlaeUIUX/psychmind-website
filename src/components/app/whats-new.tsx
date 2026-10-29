import { cn } from "cn";
import { MarkChangelogSeen } from "@/components/app/dashboard-shell";
import { PageHeader } from "@/components/app/page-header";
import { frameCard, pill, topicChipIdle } from "@/components/home/search-styles";
import type { ChangelogEntry } from "@/lib/changelog";

const dateLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

// What's new (lib/changelog.ts), for the provider dashboard and the admin
// console: one white card per entry, newest first, its date in the margin on
// wide screens. Visiting marks the newest entry as seen (the sidebar's dot).
// TODO(client): the page's title and description.
export function WhatsNew({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <>
      <MarkChangelogSeen latestId={entries[0]?.id} />
      <PageHeader title="What's new" description="Improvements to PsychMind, newest first." />
      <ol className="flex flex-col gap-3">
        {entries.map((e) => (
          <li key={e.id} className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)] md:gap-6">
            <time dateTime={e.date} className="pt-4 text-[13px] text-warm-900/60 md:text-right">
              {dateLabel(e.date)}
            </time>
            <article className={cn(frameCard, "flex flex-col gap-2 p-5")}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] leading-5 font-medium tracking-[-0.01em] text-warm-900">{e.title}</h2>
                {e.tag && <span className={cn(pill, topicChipIdle, "h-6 px-2.5 text-xs")}>{e.tag}</span>}
              </div>
              <p className="text-sm leading-[22px] text-warm-900/70">{e.body}</p>
            </article>
          </li>
        ))}
      </ol>
    </>
  );
}
