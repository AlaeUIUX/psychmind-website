import "server-only";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

// One Drizzle client for the whole app.
// - DATABASE_URL set → real Postgres (Supabase/Neon/…) via postgres-js.
//   Migrations run from `npm run db:migrate`, never at request time.
// - Not set → PGlite: Postgres compiled to WASM, for local dev with no
//   Docker and no account. It runs in memory and is saved as a compressed
//   snapshot (.data/pglite.tar.gz) shortly after each change, written
//   atomically — so killing the dev server can never corrupt it (a PGlite
//   data folder can be). Migrations are applied automatically on first use.
// The connection opens lazily on first query: PGlite has no folder lock, so
// merely importing this module (e.g. during `next build`) must never open it.
// Production on Vercel must have DATABASE_URL (no persistent disk).

type Db = ReturnType<typeof drizzlePostgres<typeof schema>>;
type Handle = { db: Db; ready: Promise<void> };

function createHandle(): Handle {
  const url = process.env.DATABASE_URL;
  if (url) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require("postgres") as typeof import("postgres");
    const client = postgres(url, { prepare: false, max: 5 });
    return { db: drizzlePostgres(client, { schema }), ready: Promise.resolve() };
  }
  if (process.env.VERCEL) throw new Error("DATABASE_URL is required on Vercel.");

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  const snapshot = path.join(process.cwd(), ".data", "pglite.tar.gz");
  mkdirSync(path.dirname(snapshot), { recursive: true });
  const client = new PGlite({
    loadDataDir: existsSync(snapshot) ? new Blob([readFileSync(snapshot)]) : undefined,
  });

  // Mark the database dirty on any call; save at most every 2 s while active.
  let dirty = true;
  let saving = false;
  for (const method of ["query", "exec", "transaction"] as const) {
    const original = client[method].bind(client) as (...args: unknown[]) => unknown;
    (client as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
      dirty = true;
      return original(...args);
    };
  }
  const save = async () => {
    if (!dirty || saving) return;
    saving = true;
    dirty = false;
    try {
      const blob = await client.dumpDataDir("gzip");
      writeFileSync(`${snapshot}.tmp`, Buffer.from(await blob.arrayBuffer()));
      renameSync(`${snapshot}.tmp`, snapshot);
    } catch (err) {
      dirty = true;
      console.error("[db] snapshot failed:", err);
    } finally {
      saving = false;
    }
  };
  setInterval(save, 2000).unref();

  const db = drizzlePglite(client, { schema });
  const ready = migratePglite(db, { migrationsFolder: path.join(process.cwd(), "drizzle") }).then(save);
  ready.catch((err) => console.error("[db] migrations failed:", err));
  // Same query API as the postgres-js client.
  return { db: db as unknown as Db, ready };
}

// Reuse across hot reloads in dev (one PGlite handle per data folder).
const globalForDb = globalThis as unknown as { __psychmindDb?: Handle };
const handle = () => (globalForDb.__psychmindDb ??= createHandle());

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = handle().db;
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

/** `await dbReady` before the first query on a path that may run first (applies dev migrations). */
export const dbReady: PromiseLike<void> = {
  then: (onFulfilled, onRejected) => handle().ready.then(onFulfilled, onRejected),
};
