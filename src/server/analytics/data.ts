import "server-only";
import { and, count, desc, eq, gte, inArray, lt, lte, ne, notLike, sql, type AnyColumn } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { analyticsDaily, analyticsTerm, analyticsVisitor, providerProfile, sessionRequest, user } from "@/db/schema";
import { addDays, ANALYTICS_TZ, eachDay, type DayRange } from "@/lib/analytics/range";
import { shortPersonName } from "@/lib/analytics/format";
import { requireRole } from "@/server/auth/session";
import { listedCondition } from "@/server/directory/data";
import { SAMPLE_DOMAIN } from "@/server/directory/sample-rows";
import { maintainAnalytics } from "./track";

// What the dashboards show. Every number is a daily total (see
// lib/analytics/events.ts), summed over the chosen days and compared with
// the same number of days just before. Each function checks its own role.

/** D24: a provider sees a search term only once it has shown them this often. */
export const TERM_THRESHOLD = 5;

const TZ = sql.raw(`'${ANALYTICS_TZ}'`);
/** The analytics day a timestamp falls on. */
const dayOf = (column: AnyColumn) => sql<string>`to_char(${column} at time zone ${TZ}, 'YYYY-MM-DD')`;
/** Timestamps inside the days from..to. */
const within = (column: AnyColumn, from: string, to: string) =>
  and(gte(column, sql`(${from}::date)::timestamp at time zone ${TZ}`), lt(column, sql`(${addDays(to, 1)}::date)::timestamp at time zone ${TZ}`));

type Point<K extends string> = { day: string } & Record<K, number>;

/** One point per day from prevFrom to `to`, all zero. */
function emptySeries<K extends string>(range: DayRange, keys: readonly K[]) {
  const series = eachDay(range.prevFrom, range.to).map((day) => ({ day, ...Object.fromEntries(keys.map((k) => [k, 0])) }) as Point<K>);
  return { series, at: new Map(series.map((p) => [p.day, p])) };
}

/** Totals for the chosen days and for the days before, plus the chosen days' series. */
function split<K extends string>(range: DayRange, series: Point<K>[], keys: readonly K[]) {
  const total = (points: Point<K>[]) => Object.fromEntries(keys.map((k) => [k, points.reduce((s, p) => s + p[k], 0)])) as Record<K, number>;
  const current = series.filter((p) => p.day >= range.from);
  return { current: total(current), previous: total(series.filter((p) => p.day < range.from)), series: current };
}

const termRows = (profileId: string, range: DayRange, limit: number, threshold = 1) => {
  const n = sql<number>`sum(${analyticsTerm.count})::int`;
  return db
    .select({ term: analyticsTerm.term, n })
    .from(analyticsTerm)
    .where(and(eq(analyticsTerm.profileId, profileId), gte(analyticsTerm.day, range.from), lte(analyticsTerm.day, range.to)))
    .groupBy(analyticsTerm.term)
    .having(sql`sum(${analyticsTerm.count}) >= ${threshold}`)
    .orderBy(desc(n), analyticsTerm.term)
    .limit(limit);
};

// ---------------------------------------------------------------------------
// A provider's own numbers (Figma D1)

export const PROVIDER_SERIES = ["impressions", "views", "requests", "saves"] as const;
export type ProviderSeriesKey = (typeof PROVIDER_SERIES)[number];

export async function providerAnalytics(range: DayRange) {
  const { user: me } = await requireRole("provider", "/provider");
  await dbReady;
  const [profile] = await db.select({ id: providerProfile.id }).from(providerProfile).where(eq(providerProfile.userId, me.id));
  if (!profile) return null;
  const id = profile.id;
  const requestDay = dayOf(sessionRequest.createdAt);

  const [daily, requests, terms, recent] = await Promise.all([
    db
      .select({ day: analyticsDaily.day, metric: analyticsDaily.metric, count: analyticsDaily.count })
      .from(analyticsDaily)
      .where(and(eq(analyticsDaily.profileId, id), gte(analyticsDaily.day, range.prevFrom), lte(analyticsDaily.day, range.to))),
    db
      .select({ day: requestDay, n: count() })
      .from(sessionRequest)
      .where(and(eq(sessionRequest.profileId, id), within(sessionRequest.createdAt, range.prevFrom, range.to)))
      .groupBy(requestDay),
    termRows(id, range, 5, TERM_THRESHOLD),
    db
      .select({ id: sessionRequest.id, name: sessionRequest.name, sessionType: sessionRequest.sessionType, format: sessionRequest.format, createdAt: sessionRequest.createdAt })
      .from(sessionRequest)
      .where(and(eq(sessionRequest.profileId, id), within(sessionRequest.createdAt, range.from, range.to)))
      .orderBy(desc(sessionRequest.createdAt))
      .limit(4),
  ]);

  const { series, at } = emptySeries(range, PROVIDER_SERIES);
  for (const r of daily) {
    const p = at.get(r.day);
    if (!p) continue;
    if (r.metric === "impression") p.impressions += r.count;
    // A quick look and a full profile are both the profile being seen.
    else if (r.metric === "quick_look" || r.metric === "profile_view") p.views += r.count;
    else if (r.metric === "save") p.saves += r.count;
  }
  for (const r of requests) {
    const p = at.get(r.day);
    if (p) p.requests += r.n;
  }

  return {
    ...split(range, series, PROVIDER_SERIES),
    terms: terms.map((t) => ({ label: t.term, count: t.n })),
    recent: recent.map((r) => ({ ...r, name: shortPersonName(r.name) })),
  };
}
export type ProviderAnalytics = NonNullable<Awaited<ReturnType<typeof providerAnalytics>>>;

// ---------------------------------------------------------------------------
// The whole site (admin)

export const SITE_SERIES = ["visitors", "pageViews", "searches", "impressions", "views", "requests", "saves", "signups"] as const;
export type SiteSeriesKey = (typeof SITE_SERIES)[number];

const PAGE_METRICS = ["view:home", "view:search", "view:profile", "view:request"] as const;

export async function siteAnalytics(range: DayRange) {
  await requireRole("admin", "/admin/analytics");
  await dbReady;
  // Folds finished days' visitor hashes into counts first.
  await maintainAnalytics();

  const requestDay = dayOf(sessionRequest.createdAt);
  const signupDay = dayOf(user.createdAt);
  const inRange = (from = range.prevFrom) => and(gte(analyticsDaily.day, from), lte(analyticsDaily.day, range.to));
  const notSample = notLike(user.email, `%@${SAMPLE_DOMAIN}`);

  const sumOf = (metrics: string[]) =>
    sql<number>`coalesce(sum(${analyticsDaily.count}) filter (where ${inArray(analyticsDaily.metric, metrics)}), 0)::int`;
  const topViews = sumOf(["quick_look", "profile_view"]);
  const topImpressions = sumOf(["impression"]);

  const [site, providers, visitors, requests, signups, terms, top] = await Promise.all([
    db
      .select({ day: analyticsDaily.day, metric: analyticsDaily.metric, count: analyticsDaily.count })
      .from(analyticsDaily)
      .where(and(eq(analyticsDaily.profileId, ""), inRange())),
    db
      .select({ day: analyticsDaily.day, metric: analyticsDaily.metric, n: sql<number>`sum(${analyticsDaily.count})::int` })
      .from(analyticsDaily)
      .where(and(ne(analyticsDaily.profileId, ""), inRange()))
      .groupBy(analyticsDaily.day, analyticsDaily.metric),
    // Today's visitors (and any day not folded yet).
    db
      .select({ day: analyticsVisitor.day, n: count() })
      .from(analyticsVisitor)
      .where(and(gte(analyticsVisitor.day, range.prevFrom), lte(analyticsVisitor.day, range.to)))
      .groupBy(analyticsVisitor.day),
    db
      .select({ day: requestDay, n: count(), demo: sql<number>`count(*) filter (where ${sessionRequest.isDemo})::int` })
      .from(sessionRequest)
      .where(within(sessionRequest.createdAt, range.prevFrom, range.to))
      .groupBy(requestDay),
    db
      .select({ day: signupDay, role: user.role, n: count() })
      .from(user)
      .where(and(within(user.createdAt, range.prevFrom, range.to), notSample))
      .groupBy(signupDay, user.role),
    termRows("", range, 8),
    db
      .select({
        profileId: analyticsDaily.profileId,
        impressions: topImpressions,
        views: topViews,
        saves: sumOf(["save"]),
      })
      .from(analyticsDaily)
      .where(and(ne(analyticsDaily.profileId, ""), inRange(range.from)))
      .groupBy(analyticsDaily.profileId)
      .orderBy(desc(topViews), desc(topImpressions))
      .limit(10),
  ]);

  const { series, at } = emptySeries(range, SITE_SERIES);
  const pages = Object.fromEntries(PAGE_METRICS.map((m) => [m, 0])) as Record<(typeof PAGE_METRICS)[number], number>;
  for (const r of site) {
    const p = at.get(r.day);
    if (!p) continue;
    if (r.metric === "visitors") p.visitors += r.count;
    else if (r.metric === "search") p.searches += r.count;
    else if (r.metric.startsWith("view:")) {
      p.pageViews += r.count;
      if (r.day >= range.from && r.metric in pages) pages[r.metric as keyof typeof pages] += r.count;
    }
  }
  for (const r of providers) {
    const p = at.get(r.day);
    if (!p) continue;
    if (r.metric === "impression") p.impressions += r.n;
    else if (r.metric === "quick_look" || r.metric === "profile_view") p.views += r.n;
    else if (r.metric === "save") p.saves += r.n;
  }
  for (const r of visitors) {
    const p = at.get(r.day);
    if (p) p.visitors += r.n;
  }
  let demoRequests = 0;
  for (const r of requests) {
    const p = at.get(r.day);
    if (!p) continue;
    p.requests += r.n;
    if (r.day >= range.from) demoRequests += r.demo;
  }
  const signupsByRole = { patient: 0, provider: 0 };
  for (const r of signups) {
    const p = at.get(r.day);
    if (!p || r.role === "admin") continue;
    p.signups += r.n;
    if (r.day >= range.from) signupsByRole[r.role] += r.n;
  }

  // Names and request counts for the most-viewed providers.
  const ids = top.map((t) => t.profileId);
  const [profiles, requestCounts] = ids.length
    ? await Promise.all([
        db
          .select({
            id: providerProfile.id,
            firstName: providerProfile.firstName,
            lastName: providerProfile.lastName,
            businessName: providerProfile.businessName,
            displayAsBusiness: providerProfile.displayAsBusiness,
            isSample: providerProfile.isSample,
          })
          .from(providerProfile)
          .where(inArray(providerProfile.id, ids)),
        db
          .select({ profileId: sessionRequest.profileId, n: count() })
          .from(sessionRequest)
          .where(and(inArray(sessionRequest.profileId, ids), within(sessionRequest.createdAt, range.from, range.to)))
          .groupBy(sessionRequest.profileId),
      ])
    : [[], []];
  const profileOf = new Map(profiles.map((p) => [p.id, p]));
  const requestsOf = new Map(requestCounts.map((r) => [r.profileId, r.n]));

  return {
    ...split(range, series, SITE_SERIES),
    demoRequests,
    signupsByRole,
    pages: PAGE_METRICS.map((m) => ({ key: m, count: pages[m] })),
    terms: terms.map((t) => ({ label: t.term, count: t.n })),
    topProviders: top.flatMap((t) => {
      const p = profileOf.get(t.profileId);
      if (!p) return [];
      return [
        {
          id: p.id,
          name: (p.displayAsBusiness && p.businessName) || [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unnamed provider",
          isSample: p.isSample,
          impressions: t.impressions,
          views: t.views,
          saves: t.saves,
          requests: requestsOf.get(p.id) ?? 0,
        },
      ];
    }),
  };
}
export type SiteAnalytics = Awaited<ReturnType<typeof siteAnalytics>>;

/** Where the directory stands right now (not tied to a date range). */
export async function directorySnapshot() {
  await requireRole("admin", "/admin/analytics");
  await dbReady;
  const real = eq(providerProfile.isSample, false);
  const [[live], [review], [patients], [samples]] = await Promise.all([
    db.select({ n: count() }).from(providerProfile).where(and(real, listedCondition())),
    db.select({ n: count() }).from(providerProfile).where(and(real, eq(providerProfile.status, "submitted"))),
    db.select({ n: count() }).from(user).where(eq(user.role, "patient")),
    db.select({ n: count() }).from(providerProfile).where(eq(providerProfile.isSample, true)),
  ]);
  return { live: live?.n ?? 0, inReview: review?.n ?? 0, patients: patients?.n ?? 0, samples: samples?.n ?? 0 };
}
