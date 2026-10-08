import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, dbReady } from "@/db";
import { user } from "@/db/schema";
import { getSession, homeFor } from "@/server/auth/session";

// Landing point after Google sign-in or an email link: sends people to the
// right home for their role. `?intent=provider` comes from choosing "I am a
// provider" before continuing with Google — it upgrades a brand-new patient
// account to provider (never an admin, never an account that's been used).
export async function GET(request: NextRequest) {
  await dbReady;
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  let role = session.user.role as string;
  const intent = request.nextUrl.searchParams.get("intent");
  if (intent === "provider" && role === "patient") {
    const ageMs = Date.now() - new Date(session.user.createdAt).getTime();
    if (ageMs < 10 * 60_000) {
      await db.update(user).set({ role: "provider" }).where(eq(user.id, session.user.id));
      role = "provider";
    }
  }
  const target = role === "provider" ? "/provider/onboarding" : homeFor(role);
  return NextResponse.redirect(new URL(target, request.url));
}
