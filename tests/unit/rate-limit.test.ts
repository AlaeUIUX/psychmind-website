import { describe, expect, it } from "vitest";
import { consumeStatement, rateLimit } from "@/lib/rate-limit";

describe("rateLimit (in-memory fallback)", () => {
  it("allows up to the limit, then blocks with a retry hint", async () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) expect((await rateLimit("contact", key, 5, "1 h")).ok).toBe(true);
    const blocked = await rateLimit("contact", key, 5, "1 h");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps separate buckets per key", async () => {
    const a = `a-${Math.random()}`;
    for (let i = 0; i < 5; i++) await rateLimit("contact", a, 5, "1 h");
    expect((await rateLimit("contact", `b-${Math.random()}`, 5, "1 h")).ok).toBe(true);
  });
});

describe("rateLimit (shared Postgres counter)", () => {
  async function counterDb() {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const client = new PGlite();
    await client.exec(`create table rate_limit_counter (key text primary key, count integer not null, window_start timestamptz not null)`);
    const db = drizzle(client);
    const consume = async (id: string, windowSeconds: number) =>
      (await db.execute(consumeStatement(id, windowSeconds))).rows[0] as { count: number; remaining: number };
    return { client, consume };
  }

  it("counts concurrent requests exactly once each", async () => {
    const { consume } = await counterDb();
    const results = await Promise.all(Array.from({ length: 12 }, () => consume("k", 60)));
    expect(results.map((r) => r.count).sort((a, b) => a - b)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(results.every((r) => r.remaining > 0 && r.remaining <= 60)).toBe(true);
  });

  it("starts a new window once the old one has ended", async () => {
    const { client, consume } = await counterDb();
    await consume("k", 60);
    await consume("k", 60);
    await client.exec(`update rate_limit_counter set window_start = now() - interval '61 seconds'`);
    expect((await consume("k", 60)).count).toBe(1);
  });
});
