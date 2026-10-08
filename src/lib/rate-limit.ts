import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { sql, type SQL } from "drizzle-orm";
import { createHash } from "node:crypto";

// Rate limits for anything a stranger can trigger (contact form, sign-up,
// log in, two-step codes…). Serverless instances don't share memory, so in
// production the counts must live somewhere shared:
// 1. Upstash Redis, when UPSTASH_REDIS_REST_URL / _TOKEN are set (or
//    KV_REST_API_URL / _TOKEN, the names Vercel's integration uses);
// 2. otherwise Postgres (DATABASE_URL): one atomic upsert per check in the
//    rate_limit_counter table — free, and plenty at PsychMind's scale;
// 3. otherwise (local dev with PGlite) a per-instance in-memory window.
// If the shared store can't be reached it falls back to memory: best effort,
// but sign-in never goes down with it. Keys are hashed before they're stored,
// so no IP address or email is ever written down.

type Window = `${number} ${"s" | "m" | "h" | "d"}`;
type Result = { ok: boolean; retryAfterSeconds: number };

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const driver = redis ? "redis" : process.env.DATABASE_URL ? "postgres" : "memory";

const limiters = new Map<string, Ratelimit>();
const memory = new Map<string, number[]>();

function toMs(window: Window) {
  const [amount, unit] = window.split(" ") as [string, "s" | "m" | "h" | "d"];
  return Number(amount) * { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
}

const hashKey = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 40);

/** Counts one request against `id` in a fixed window of `windowSeconds`,
 *  starting a new window once the old one has ended — in a single statement,
 *  so concurrent requests can't both slip under the limit. */
export function consumeStatement(id: string, windowSeconds: number): SQL {
  const span = sql`make_interval(secs => ${windowSeconds})`;
  return sql`
    insert into rate_limit_counter (key, count, window_start) values (${id}, 1, now())
    on conflict (key) do update set
      count = case when rate_limit_counter.window_start <= now() - ${span} then 1 else rate_limit_counter.count + 1 end,
      window_start = case when rate_limit_counter.window_start <= now() - ${span} then now() else rate_limit_counter.window_start end
    returning count::int as count, greatest(0, ceil(extract(epoch from (window_start + ${span} - now()))))::int as remaining`;
}

async function consumeInPostgres(id: string, limit: number, span: number): Promise<Result> {
  const { db } = await import("@/db");
  const result = (await db.execute(consumeStatement(id, Math.ceil(span / 1000)))) as unknown;
  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { count: number; remaining: number }[];
  const { count, remaining } = rows[0];
  // Now and then, clear counters whose windows ended long ago.
  if (Math.random() < 0.01) {
    db.execute(sql`delete from rate_limit_counter where window_start < now() - interval '2 days'`).catch(() => {});
  }
  return count <= limit ? { ok: true, retryAfterSeconds: 0 } : { ok: false, retryAfterSeconds: Math.max(1, remaining) };
}

function consumeInMemory(bucket: string, limit: number, span: number): Result {
  const now = Date.now();
  const hits = (memory.get(bucket) ?? []).filter((t) => now - t < span);
  if (hits.length >= limit) {
    memory.set(bucket, hits);
    return { ok: false, retryAfterSeconds: Math.ceil((span - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  memory.set(bucket, hits);
  return { ok: true, retryAfterSeconds: 0 };
}

/** Returns `{ ok: false }` once `key` has made more than `limit` calls in `window`. */
export async function rateLimit(name: string, key: string, limit: number, window: Window): Promise<Result> {
  const span = toMs(window);
  const id = hashKey(`${name}:${limit}:${window}:${key}`);
  try {
    if (driver === "redis") {
      const limiterId = `${name}:${limit}:${window}`;
      let limiter = limiters.get(limiterId);
      if (!limiter) {
        limiter = new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(limit, window), prefix: "rl" });
        limiters.set(limiterId, limiter);
      }
      const { success, reset } = await limiter.limit(id);
      return { ok: success, retryAfterSeconds: Math.max(0, Math.ceil((reset - Date.now()) / 1000)) };
    }
    if (driver === "postgres") return await consumeInPostgres(id, limit, span);
  } catch (err) {
    console.error(`[rate-limit] ${driver} unavailable, using in-memory window`, err instanceof Error ? err.message : err);
  }
  return consumeInMemory(id, limit, span);
}

/** Best-effort client IP for rate-limit keys (Vercel sets x-forwarded-for).
 *  Used only as a limiter key — hashed, never stored or logged as is. */
export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
