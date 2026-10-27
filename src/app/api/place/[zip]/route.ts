import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isZip } from "@/lib/zip";
import { lookupZip } from "@/server/zip";

// GET → { places: [{ city, state }] } for the home search's ZIP field, which names
// the place a ZIP belongs to. Anyone can ask (the home page is public), unlike
// /api/zip, so it answers for 5-digit ZIPs only and is rate-limited per IP. The
// lookup runs on our server (server/zip.ts, cached), so visitors' browsers still
// contact no other host (legal safeguard 2). The answer is the same for everyone,
// so it may be cached publicly.
export async function GET(request: NextRequest, { params }: { params: Promise<{ zip: string }> }) {
  const { zip } = await params;
  if (!isZip(zip)) return NextResponse.json({ error: "Not a ZIP code." }, { status: 400 });
  if (!(await rateLimit("place-lookup", clientIp(request.headers), 30, "10 m")).ok) {
    return NextResponse.json({ error: "Too many lookups." }, { status: 429 });
  }
  const result = await lookupZip(zip);
  if (result.status === "found") {
    return NextResponse.json({ places: result.places }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000" } });
  }
  return NextResponse.json(
    { error: result.status === "not_found" ? "Unknown ZIP code." : "Lookup unavailable." },
    { status: result.status === "not_found" ? 404 : 503 },
  );
}
