import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { db, dbReady } from "@/db";
import { appHost } from "@/lib/hosts";
import { storageDriver } from "@/server/storage";
import { appUrl } from "@/server/url";
import journal from "../../../../drizzle/meta/_journal.json";
import { CopyField } from "./copy-field";

export const metadata: Metadata = { title: "Setup check — PsychMind", robots: { index: false } };
export const dynamic = "force-dynamic";

// What this deployment is configured with, for getting sign-in working on a
// preview or locally. Shows only yes/no and public URLs — never a secret.
// Step-by-step guide: docs/live-testing.md. Never available in production.

type Status = "ok" | "warn" | "error" | "off";
type Row = { label: string; status: Status; badge: string; detail: string };

const VARIANT = { ok: "success", warn: "warning", error: "danger", off: "neutral" } as const;

async function databaseRow(): Promise<Row> {
  const remote = Boolean(process.env.DATABASE_URL);
  if (!remote && process.env.VERCEL) {
    return { label: "Database", status: "error", badge: "Missing", detail: "Set DATABASE_URL (Neon or Supabase Postgres), then redeploy." };
  }
  try {
    await dbReady;
    const result = (await db.execute(sql`select count(*)::int as n from drizzle.__drizzle_migrations`)) as unknown;
    const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { n: number }[];
    const applied = rows[0]?.n ?? 0;
    const total = journal.entries.length;
    const where = remote ? "Postgres (DATABASE_URL)" : "PGlite on this machine (.data/pglite.tar.gz)";
    if (applied < total) {
      return { label: "Database", status: "warn", badge: `${applied}/${total} migrations`, detail: `${where}. Run npm run db:migrate, or redeploy.` };
    }
    return { label: "Database", status: "ok", badge: "Connected", detail: `${where}, all ${total} migrations applied.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { label: "Database", status: "error", badge: "Can't connect", detail: message.slice(0, 200) };
  }
}

function emailRow(): Row {
  const from = process.env.EMAIL_FROM || "PsychMind <onboarding@resend.dev>";
  const outbox = !process.env.RESEND_API_KEY || process.env.EMAIL_TRANSPORT === "outbox";
  if (outbox) {
    return process.env.VERCEL
      ? { label: "Email", status: "warn", badge: "Not sending", detail: "Set RESEND_API_KEY (and leave EMAIL_TRANSPORT empty). Google sign-in works without email; email sign-up needs it." }
      : { label: "Email", status: "ok", badge: "Local outbox", detail: "Emails land in /dev/mail instead of being sent." };
  }
  if (from.includes("resend.dev")) {
    return { label: "Email", status: "warn", badge: "Test sender", detail: `Resend, from ${from}. The shared resend.dev sender only delivers to your own Resend account's address until a domain is verified.` };
  }
  return { label: "Email", status: "ok", badge: "Resend", detail: `From ${from}. The domain must be verified in Resend.` };
}

export default async function DevSetupPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const origin = new URL(await appUrl("/")).origin;
  const callback = `${origin}/api/auth/callback/google`;
  const { protocol, hostname } = new URL(origin);
  const googleReachable = protocol === "https:" || hostname === "localhost";
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const env = process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "development" ? "local" : "local build");
  const split = appHost();
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").filter((e) => e.trim()).length;

  const rows: Row[] = [
    await databaseRow(),
    process.env.BETTER_AUTH_SECRET
      ? { label: "Session secret", status: "ok", badge: "Set", detail: "BETTER_AUTH_SECRET signs session cookies." }
      : process.env.VERCEL
        ? { label: "Session secret", status: "error", badge: "Missing", detail: "Set BETTER_AUTH_SECRET (openssl rand -base64 32). Sign-in fails without it." }
        : { label: "Session secret", status: "off", badge: "Dev default", detail: "Fine locally. Deployments need BETTER_AUTH_SECRET." },
    google
      ? googleReachable
        ? { label: "Google sign-in", status: "ok", badge: "On", detail: "The Google button shows on log in and sign up." }
        : { label: "Google sign-in", status: "warn", badge: "Wrong host", detail: `Google only allows http://localhost for local testing, not ${hostname}. Set APP_HOST=off in .env.local, restart, and open http://localhost:${process.env.PORT ?? 3000}/login.` }
      : { label: "Google sign-in", status: "off", badge: "Off", detail: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to show the Google button." },
    emailRow(),
    {
      label: "File uploads",
      status: "ok",
      badge: storageDriver === "db" ? "Database" : "Disk",
      detail: storageDriver === "db" ? "Photos and license files are stored privately in Postgres." : "Stored in .data/uploads on this machine.",
    },
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_BASE && process.env.STRIPE_WEBHOOK_SECRET
      ? { label: "Payments", status: "ok", badge: "Stripe", detail: "Provider subscriptions are on." }
      : { label: "Payments", status: "off", badge: "Not connected", detail: "Optional for now. The billing page says payments aren't connected yet." },
    admins
      ? { label: "Admins", status: "ok", badge: `${admins} email${admins === 1 ? "" : "s"}`, detail: "ADMIN_EMAILS become admins once their email is verified (Google counts)." }
      : { label: "Admins", status: "off", badge: "None", detail: "Add your email to ADMIN_EMAILS to open /admin." },
  ];

  return (
    <div className="app-ui min-h-svh bg-warm-50 text-warm-900">
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-2">
          <p className="type-ui-label text-text-tertiary">
            {env} · {origin}
            {split ? ` · portal on ${split}` : ""}
          </p>
          <h1 className="type-ui-headline text-text-primary">Setup check</h1>
          <p className="type-ui-body text-text-tertiary">
            What this deployment can do right now. Values are never shown, only whether they&apos;re set.
          </p>
        </header>

        <ul className="flex flex-col divide-y divide-warm-200 overflow-hidden rounded-card border border-warm-200 bg-white">
          {rows.map((row) => (
            <li key={row.label} className="flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-start sm:gap-6" data-testid="setup-row">
              <span className="type-ui-heading w-36 shrink-0 text-text-primary">{row.label}</span>
              <span className="type-ui-small min-w-0 flex-1 text-text-tertiary">{row.detail}</span>
              <Badge variant={VARIANT[row.status]} className="order-first sm:order-none">
                {row.badge}
              </Badge>
            </li>
          ))}
        </ul>

        <section className="flex flex-col gap-5 rounded-card border border-warm-200 bg-white p-5">
          <div className="flex flex-col gap-1">
            <h2 className="type-ui-title text-text-primary">Google Cloud OAuth client</h2>
            <p className="type-ui-small text-text-tertiary">
              In Google Cloud → APIs &amp; Services → Credentials, open your Web client and paste these. Changes can take a
              few minutes to apply.
            </p>
          </div>
          <CopyField label="Authorized JavaScript origin" value={origin} />
          <CopyField label="Authorized redirect URI" value={callback} />
          {!googleReachable && (
            <p className="type-ui-small rounded-field border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
              Google rejects {hostname}. Locally, set APP_HOST=off and use http://localhost:{process.env.PORT ?? 3000} instead.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
