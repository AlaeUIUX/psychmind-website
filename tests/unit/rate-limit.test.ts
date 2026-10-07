import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

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
