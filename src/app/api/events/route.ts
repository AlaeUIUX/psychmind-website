import { getSessionCookie } from "better-auth/cookies";
import { and, eq, inArray } from "drizzle-orm";
import { after, NextResponse, type NextRequest } from "next/server";
import { db, dbReady } from "@/db";
import { providerProfile } from "@/db/schema";
import { batchSchema, termLabel } from "@/lib/analytics/events";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { bump, bumpTerms, maintainAnalytics, recordVisitor } from "@/server/analytics/track";
import { auth } from "@/server/auth";
import { listedCondition } from "@/server/directory/data";

// Analytics beacons from the browser (lib/analytics/client.ts). Counts only;
// see lib/analytics/events.ts for what's accepted and why.

const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python-requests/i;
/** A real page sends each provider's events a few times per batch at most,
 *  so one request can't inflate anyone's numbers. */
const PER_PROVIDER = 3;
const PER_SITE_METRIC = 10;
const done = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOTS.test(ua)) return done();

  // Only our own pages report (beacons carry an Origin header).
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let ours = false;
    try {
      ours = new URL(origin).host === host;
    } catch {}
    if (!ours) return done();
  }

  const ip = clientIp(request.headers);
  if (!(await rateLimit("events", ip, 1000, "1 h")).ok) return done();

  const text = await request.text();
  if (text.length > 20_000) return new NextResponse(null, { status: 413 });
  let parsed;
  try {
    parsed = batchSchema.safeParse(JSON.parse(text));
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const events = parsed.data.events;

  // Public ids → profile ids, for listed providers only.
  const ids = Array.from(new Set(events.flatMap((e) => ("p" in e ? [e.p] : []))));
  await dbReady;
  const profiles = ids.length
    ? await db
        .select({ id: providerProfile.id, publicId: providerProfile.publicId })
        .from(providerProfile)
        .where(and(inArray(providerProfile.publicId, ids), listedCondition()))
    : [];
  const profileOf = new Map(profiles.map((p) => [p.publicId, p.id]));

  // A provider looking at their own profile isn't a patient finding them.
  if (profiles.length && getSessionCookie(request, { cookiePrefix: "psychmind" })) {
    const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
    if (session?.user.role === "provider") {
      const [own] = await db.select({ publicId: providerProfile.publicId }).from(providerProfile).where(eq(providerProfile.userId, session.user.id));
      if (own) profileOf.delete(own.publicId);
    }
  }

  const counts = new Map<string, { metric: string; profileId: string; n: number }>();
  const terms = new Map<string, { profileId: string; term: string; n: number }>();
  const add = (metric: string, profileId = "") => {
    const key = `${metric}|${profileId}`;
    const c = counts.get(key) ?? { metric, profileId, n: 0 };
    if (c.n >= (profileId ? PER_PROVIDER : PER_SITE_METRIC)) return;
    c.n++;
    counts.set(key, c);
  };
  const addTerm = (term: string | null, profileId = "") => {
    if (!term) return;
    const key = `${profileId}|${term}`;
    const t = terms.get(key) ?? { profileId, term, n: 0 };
    if (t.n >= (profileId ? PER_PROVIDER : PER_SITE_METRIC)) return;
    t.n++;
    terms.set(key, t);
  };

  for (const e of events) {
    if (e.t === "view") add(`view:${e.page}`);
    else if (e.t === "search") {
      add("search");
      addTerm(termLabel(e.s));
    } else {
      const profileId = profileOf.get(e.p);
      if (!profileId) continue;
      add(e.t, profileId);
      if (e.t === "impression") addTerm(termLabel(e.s), profileId);
    }
  }

  await bump([...counts.values()]);
  await bumpTerms([...terms.values()]);
  // Unique visitors, unless the browser asks not to be counted.
  if (request.headers.get("dnt") !== "1" && request.headers.get("sec-gpc") !== "1") await recordVisitor(ip, ua);
  after(() => maintainAnalytics());
  return done();
}
