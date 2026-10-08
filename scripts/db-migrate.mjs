// Applies the SQL migrations in ./drizzle to DATABASE_URL.
// - `npm run db:migrate` (reads .env.local): apply them by hand.
// - `npm run build` passes --deploy: on Vercel the migrations run before every
//   build; anywhere else (local builds) that step is skipped.
// Without DATABASE_URL it skips quietly (local dev uses PGlite), so a deploy
// never fails just because no database is connected yet.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import nextEnv from "@next/env";
import postgres from "postgres";

if (process.argv.includes("--deploy") && !process.env.VERCEL) process.exit(0);
nextEnv.loadEnvConfig(process.cwd());

// Prefer a direct (unpooled) connection for DDL when the provider gives one (Neon does).
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.log("[db-migrate] DATABASE_URL not set, skipping (local dev uses PGlite).");
  process.exit(0);
}

const client = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("[db-migrate] migrations applied.");
} catch (err) {
  console.error("[db-migrate] failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end();
}
