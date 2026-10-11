import { NextResponse, type NextRequest } from "next/server";
import { dbReady } from "@/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { unsubscribe } from "@/server/marketing";

// One-click unsubscribe (RFC 8058): mail apps POST here from the
// List-Unsubscribe header that every marketing email carries
// (server/marketing.ts). People clicking the link in the email land on
// /unsubscribe/[token] instead.
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limit = await rateLimit("unsubscribe", clientIp(request.headers), 30, "10 m");
  if (!limit.ok) return new NextResponse(null, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  await dbReady;
  const { token } = await params;
  return new NextResponse(null, { status: (await unsubscribe(token)) ? 200 : 404 });
}
