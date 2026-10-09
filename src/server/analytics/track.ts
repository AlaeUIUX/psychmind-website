import "server-only";
import { createHash } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { after } from "next/server";
import { db, dbReady } from "@/db";
import { analyticsDaily, analyticsTerm, analyticsVisitor } from "@/db/schema";
import { addDays, dayOf } from "@/lib/analytics/range";

// Adds to the daily totals. Callers pass counts they've already grouped, so
// one request is one insert per table however many events it carried.

/** Today, as the dashboards count days (New York time, YYYY-MM-DD). */
export const analyticsDay = (at = new Date()) => dayOf(at);

type Count = { metric: string; profileId?: string; n?: number };

export async function bump(counts: Count[], day = analyticsDay()) {
  const rows = counts.filter((c) => (c.n ?? 1) > 0).map((c) => ({ day, metric: c.metric, profileId: c.profileId ?? "", count: c.n ?? 1 }));
  if (!rows.length) return;
  await dbReady;
  await db
    .insert(analyticsDaily)
    .values(rows)
    .onConflictDoUpdate({
      target: [analyticsDaily.day, analyticsDaily.metric, analyticsDaily.profileId],
      set: { count: sql`${analyticsDaily.count} + excluded.count` },
    });
}

export async function bumpTerms(terms: { profileId?: string; term: string; n: number }[], day = analyticsDay()) {
  const rows = terms.map((t) => ({ day, profileId: t.profileId ?? "", term: t.term.slice(0, 120), count: t.n }));
  if (!rows.length) return;
  await dbReady;
  await db
    .insert(analyticsTerm)
    .values(rows)
    .onConflictDoUpdate({
      target: [analyticsTerm.day, analyticsTerm.profileId, analyticsTerm.term],
      set: { count: sql`${analyticsTerm.count} + excluded.count` },
    });
}

/** Counts a visitor once per day without keeping anything that identifies
 *  them: the salt changes daily and is derived from a server secret, and
 *  maintainAnalytics() turns each finished day's hashes into a plain count. */
export async function recordVisitor(ip: string, userAgent: string, day = analyticsDay()) {
  const secret = process.env.BETTER_AUTH_SECRET || "psychmind-dev";
  const salt = createHash("sha256").update(`${secret}:${day}`).digest("hex");
  const hash = createHash("sha256").update(`${salt}:${ip}:${userAgent}`).digest("hex").slice(0, 32);
  await dbReady;
  await db.insert(analyticsVisitor).values({ day, hash }).onConflictDoNothing();
}

/** For server-side moments (a save, a request): counted after the response,
 *  and never allowed to break the action. */
export function track(metric: string, profileId: string) {
  after(() => bump([{ metric, profileId }]).catch((err) => console.error("analytics", err)));
}

let maintained: { day: string; run: Promise<void> } | null = null;

/** Once a day per server instance. Past days' visitor hashes become a count
 *  and are deleted (one statement, so two instances can't count a day
 *  twice), and search terms older than a year are dropped (D23). */
export function maintainAnalytics(today = analyticsDay()) {
  if (maintained?.day !== today) {
    const run = (async () => {
      await dbReady;
      await db.execute(sql`
        with gone as (delete from analytics_visitor where day < ${today}::date returning day)
        insert into analytics_daily (day, metric, profile_id, count)
        select day, 'visitors', '', count(*)::int from gone group by day
        on conflict (day, metric, profile_id) do update set count = analytics_daily.count + excluded.count`);
      await db.delete(analyticsTerm).where(lt(analyticsTerm.day, addDays(today, -365)));
    })();
    maintained = {
      day: today,
      run: run.catch((err) => {
        maintained = null;
        console.error("analytics maintenance", err);
      }),
    };
  }
  return maintained.run;
}
