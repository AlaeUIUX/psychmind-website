import { defineConfig } from "drizzle-kit";

// `npm run db:generate` writes SQL migrations to ./drizzle from src/db/schema.
// `npm run db:migrate` applies them to DATABASE_URL (Supabase/Neon/…).
// Locally without DATABASE_URL the app applies them to PGlite on startup.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
});
