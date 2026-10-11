import { NextResponse, type NextRequest } from "next/server";
import { isZip } from "@/lib/zip";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/server/auth/session";
import { lookupZip } from "@/server/zip";

// GET → { places: [{ city, state }] } for the practice address step. Signed-in
// users only (so it isn't an open proxy), and rate-limited per account.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ zip: string }> }) {
  const { zip } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  if (!isZip(zip)) return NextResponse.json({ error: "Not a ZIP code." }, { status: 400 });
  if (!(await rateLimit("zip-lookup", session.user.id, 60, "10 m")).ok) return NextResponse.json({ error: "Too many lookups." }, { status: 429 });
  const result = await lookupZip(zip);
  if (result.status === "found") return NextResponse.json({ places: result.places }, { headers: { "Cache-Control": "private, max-age=86400" } });
  return NextResponse.json({ error: result.status === "not_found" ? "Unknown ZIP code." : "Lookup unavailable." }, { status: result.status === "not_found" ? 404 : 503 });
}
