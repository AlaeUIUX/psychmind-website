import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Migration 0007 seeds the sample providers into a fresh database. It must
// match what Admin → "Add sample providers" creates, never duplicate anyone,
// and stay away once an admin has removed the samples.

const folder = path.join(process.cwd(), "drizzle");
const seedSql = readFileSync(path.join(folder, "0007_sample_providers.sql"), "utf8");

async function freshDb() {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite();
  await migrate(drizzle(client), { migrationsFolder: folder });
  return client;
}

const count = async (client: Awaited<ReturnType<typeof freshDb>>, sql: string) =>
  ((await client.query<{ n: number }>(sql)).rows[0]?.n ?? 0) as number;

describe("sample provider seed (migration 0007)", () => {
  it("adds 50 approved sample providers with locations and verified licenses, once", async () => {
    const db = await freshDb();
    expect(await count(db, `select count(*)::int as n from provider_profile where is_sample and status = 'approved'`)).toBe(50);
    expect(await count(db, `select count(distinct public_id)::int as n from provider_profile`)).toBe(50);
    const locations = await count(db, `select count(*)::int as n from provider_location`);
    const licenses = await count(db, `select count(*)::int as n from provider_license where status = 'verified'`);
    expect(locations).toBeGreaterThanOrEqual(50);
    expect(licenses).toBe(locations);
    expect(await count(db, `select count(*)::int as n from provider_location where is_primary`)).toBe(50);

    // Running it again changes nothing.
    await db.exec(seedSql.replaceAll("--> statement-breakpoint", ""));
    expect(await count(db, `select count(*)::int as n from provider_profile`)).toBe(50);
    await db.close();
  }, 60_000);

  it("stays away once an admin has removed the samples", async () => {
    const db = await freshDb();
    await db.exec(`delete from "user" where email like '%@samples.psychmind.test'`);
    await db.exec(`insert into audit_log (id, action, target_type, target_id) values ('x', 'samples.removed', 'directory', 'samples')`);
    await db.exec(seedSql.replaceAll("--> statement-breakpoint", ""));
    expect(await count(db, `select count(*)::int as n from provider_profile`)).toBe(0);
    await db.close();
  }, 60_000);
});
