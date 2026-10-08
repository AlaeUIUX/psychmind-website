import "server-only";
import { eq } from "drizzle-orm";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { fileBlob } from "@/db/schema";

// File bytes for uploads (profile photos, license documents). Two drivers:
// - "disk" (local dev default): .data/uploads on this machine.
// - "db" (default on Vercel, which has no persistent disk): a private bytea
//   table in Postgres. Fine for an MVP's photos and PDFs; Supabase Storage
//   (private bucket) replaces it at scale.
// Files are never served directly: /api/files/[id] checks who's asking.

const ROOT = path.join(process.cwd(), ".data", "uploads");
const driver = process.env.STORAGE_DRIVER ?? (process.env.VERCEL ? "db" : "disk");

function resolveKey(key: string) {
  const full = path.join(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Invalid storage key.");
  return full;
}

export async function putFile(key: string, bytes: Uint8Array) {
  if (driver === "db") {
    await db.insert(fileBlob).values({ key, bytes: Buffer.from(bytes) }).onConflictDoUpdate({ target: fileBlob.key, set: { bytes: Buffer.from(bytes) } });
    return;
  }
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

export async function getFile(key: string) {
  if (driver === "db") {
    const [row] = await db.select({ bytes: fileBlob.bytes }).from(fileBlob).where(eq(fileBlob.key, key));
    if (!row) throw new Error("File not found.");
    return new Uint8Array(row.bytes);
  }
  return new Uint8Array(await readFile(resolveKey(key)));
}

export async function deleteFile(key: string) {
  if (driver === "db") {
    await db.delete(fileBlob).where(eq(fileBlob.key, key));
    return;
  }
  await rm(resolveKey(key), { force: true });
}

export const storageDriver = driver;
