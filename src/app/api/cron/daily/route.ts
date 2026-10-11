import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { maintainAnalytics } from "@/server/analytics/track";
import { sweepBilling } from "@/server/billing/notices";
import { sendOnboardingReminders } from "@/server/onboarding/reminders";
import { cleanUpUnsavedUploads } from "@/server/uploads-cleanup";

// The daily job (vercel.json → crons). Vercel calls it with
// "Authorization: Bearer <CRON_SECRET>"; anything else is refused.
// Every task is safe to run again (an email is sent once, ever; a deleted
// file stays deleted), so a retry or a manual call does no harm. Each task
// has its own try/catch: one failing doesn't stop the others.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Local convenience only: `next dev` with no CRON_SECRET set may call it
  // without a header (curl http://localhost:3000/api/cron/daily). Anywhere
  // else, no secret means no access.
  if (!secret) return process.env.NODE_ENV === "development";
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function run<T>(name: string, task: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await task();
  } catch (err) {
    console.error(`[cron] ${name} failed`, err);
    return { error: err instanceof Error ? err.message : "failed" };
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // A deployment without its database (production before the app launches) has nothing to do.
  if (process.env.VERCEL && !process.env.DATABASE_URL) return NextResponse.json({ ok: true, skipped: "No database configured." });
  const started = Date.now();
  const now = new Date();
  const summary = {
    uploads: await run("uploads", () => cleanUpUnsavedUploads(now)),
    onboardingReminders: await run("onboardingReminders", () => sendOnboardingReminders(now)),
    billing: await run("billing", () => sweepBilling(now)),
    // Also runs on analytics traffic (/api/events); this covers quiet days.
    analytics: await run("analytics", async () => {
      await maintainAnalytics();
      return { ok: true };
    }),
  };
  return NextResponse.json({ ok: true, ms: Date.now() - started, ...summary });
}
