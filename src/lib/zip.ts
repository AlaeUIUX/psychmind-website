// ZIP code → city and state, for filling in the practice address. Optional
// help only: the fields always stay editable, and a failed lookup changes
// nothing. The lookup runs on our server (server/zip.ts), so visitors'
// browsers still contact no other host (legal safeguard 2).

export type ZipPlace = { city: string; state: string };

export const isZip = (value: string) => /^\d{5}$/.test(value);

/** Zippopotam.us's answer ({ places: [{ "place name", "state abbreviation" }] })
 *  → up to 5 places, or null if it isn't one. */
export function parseZipResponse(body: unknown): ZipPlace[] | null {
  const places = (body as { places?: unknown } | null)?.places;
  if (!Array.isArray(places)) return null;
  const out: ZipPlace[] = [];
  for (const p of places) {
    const city = String((p as Record<string, unknown>)?.["place name"] ?? "").trim();
    const state = String((p as Record<string, unknown>)?.["state abbreviation"] ?? "").trim().toUpperCase();
    if (city && /^[A-Z]{2}$/.test(state) && !out.some((o) => o.city === city && o.state === state)) out.push({ city, state });
    if (out.length === 5) break;
  }
  return out.length ? out : null;
}
