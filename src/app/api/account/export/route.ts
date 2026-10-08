import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { exportAccountData } from "@/server/account/export";
import { getSession } from "@/server/auth/session";

// "Download my data" for the signed-in person only. Never cached.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in to download your data." }, { status: 401 });
  if (!(await rateLimit("account-export", session.user.id, 5, "1 h")).ok) {
    return NextResponse.json({ error: "Too many downloads. Try again in an hour." }, { status: 429 });
  }
  const data = await exportAccountData(session.user.id);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="psychmind-data-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
