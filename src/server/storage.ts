import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// File bytes for uploads (profile photos, license documents). Locally they
// live in .data/uploads. Serverless hosts have no persistent disk, so
// production needs a real bucket — Supabase Storage (private bucket) is the
// plan; until it's configured, uploads in production fail with a clear error.
// Files are never served directly: /api/files/[id] checks who's asking.

const ROOT = path.join(process.cwd(), ".data", "uploads");

function assertWritable() {
  if (process.env.VERCEL) {
    throw new Error("File storage isn't configured for this deployment yet (Supabase Storage).");
  }
}

function resolveKey(key: string) {
  const full = path.join(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Invalid storage key.");
  return full;
}

export async function putFile(key: string, bytes: Uint8Array) {
  assertWritable();
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

export async function getFile(key: string) {
  return new Uint8Array(await readFile(resolveKey(key)));
}

export async function deleteFile(key: string) {
  await rm(resolveKey(key), { force: true });
}
