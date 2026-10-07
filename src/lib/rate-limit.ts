import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Sliding-window rate limits for writes a stranger can trigger (contact form,
// sign-up, session requests…). Backed by Upstash Redis when
// UPSTASH_REDIS_REST_URL / _TOKEN are set, which is what production needs:
// serverless instances don't share memory. Without them (local dev, or until
// the Upstash project exists) it falls back to a per-instance in-memory
// window — best effort, but never blocks development.

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const limiters = new Map<string, Ratelimit>();
const memory = new Map<string, number[]>();

function toMs(window: Window) {
  const [amount, unit] = window.split(" ") as [string, "s" | "m" | "h" | "d"];
  return Number(amount) * { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
}

/** Returns `{ ok: false }` once `key` has made more than `limit` calls in `window`. */
export async function rateLimit(
  name: string,
  key: string,
  limit: number,
  window: Window,
): Promise<{ ok: boolean; retryAfterSeconds: number }> {
  if (redis) {
    const id = `${name}:${limit}:${window}`;
    let limiter = limiters.get(id);
    if (!limiter) {
      limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, window), prefix: `rl:${name}` });
      limiters.set(id, limiter);
    }
    const { success, reset } = await limiter.limit(key);
    return { ok: success, retryAfterSeconds: Math.max(0, Math.ceil((reset - Date.now()) / 1000)) };
  }

  const now = Date.now();
  const span = toMs(window);
  const bucket = `${name}:${key}`;
  const hits = (memory.get(bucket) ?? []).filter((t) => now - t < span);
  if (hits.length >= limit) {
    memory.set(bucket, hits);
    return { ok: false, retryAfterSeconds: Math.ceil((span - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  memory.set(bucket, hits);
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP for rate-limit keys (Vercel sets x-forwarded-for).
 *  Used only as a limiter key — never stored or logged. */
export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
