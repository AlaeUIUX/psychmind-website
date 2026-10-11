import "server-only";
import { isZip, parseZipResponse, type ZipPlace } from "@/lib/zip";

// The ZIP lookup behind /api/zip/[zip]: Zippopotam.us (free, no key; only the
// ZIP is sent). Answers are cached for a month; a slow or failed lookup gives
// up after 2.5 seconds and the provider types the city and state themselves.

const cache = new Map<string, ZipPlace[] | "none">();

export type ZipLookup = { status: "found"; places: ZipPlace[] } | { status: "not_found" } | { status: "unavailable" };

export async function lookupZip(zip: string): Promise<ZipLookup> {
  if (!isZip(zip)) return { status: "not_found" };
  const cached = cache.get(zip);
  if (cached) return cached === "none" ? { status: "not_found" } : { status: "found", places: cached };
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      signal: AbortSignal.timeout(2500),
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (response.status === 404) {
      cache.set(zip, "none");
      return { status: "not_found" };
    }
    if (!response.ok) return { status: "unavailable" };
    const places = parseZipResponse(await response.json());
    if (!places) {
      cache.set(zip, "none");
      return { status: "not_found" };
    }
    if (cache.size > 5000) cache.clear();
    cache.set(zip, places);
    return { status: "found", places };
  } catch {
    return { status: "unavailable" };
  }
}
