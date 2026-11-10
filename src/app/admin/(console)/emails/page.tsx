import { cn } from "cn";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { LocalTime } from "@/components/app/local-time";
import { PageHeader } from "@/components/app/page-header";
import { StatusBanner } from "@/components/app/status-banner";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/hugeicons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { markAllEmailFailuresHandled, markEmailFailureHandled } from "@/server/admin/email-failure-actions";
import { listEmailFailures } from "@/server/admin/email-failures";
import { senderConfigured } from "@/server/email";

export const metadata: Metadata = { title: "Failed emails — PsychMind admin" };

// Emails PsychMind couldn't send (server/email.ts records each one): a
// confirmation link, a password reset, an alert to the team. Before this,
// they failed silently. Newest first; the team follows up, then marks them
// handled. Kept 90 days.

export default async function AdminEmailFailuresPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view === "handled" ? "handled" : "open";
  const rows = await listEmailFailures(view);
  // Only when email really goes through Resend (not the local outbox).
  const senderMissing = Boolean(process.env.RESEND_API_KEY) && process.env.EMAIL_TRANSPORT !== "outbox" && !senderConfigured();
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Admin" }, { label: "Failed emails" }]}
        title="Failed emails"
        description="Emails PsychMind couldn't send, such as a confirmation link or a password reset. Check the sending service (Resend) for the cause, then follow up with the person if they need it."
      />
      {senderMissing && (
        <StatusBanner tone="warning" title="No sender address is set">
          EMAIL_FROM isn&apos;t set, so emails go out from Resend&apos;s test sender, which only delivers to the Resend account&apos;s owner. Set EMAIL_FROM on Vercel to an address on psychmind.org.
        </StatusBanner>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter emails" className="flex gap-1">
          {(["open", "handled"] as const).map((v) => (
            <Link
              key={v}
              href={v === "open" ? "/admin/emails" : "/admin/emails?view=handled"}
              aria-current={view === v ? "page" : undefined}
              className={cn(
                "rounded-pill px-3.5 py-1.5 type-small font-medium text-text-secondary transition-colors hover:bg-warm-100",
                view === v && "bg-warm-200/70 text-text-primary hover:bg-warm-200/70",
              )}
            >
              {v === "open" ? "To look at" : "Handled"}
            </Link>
          ))}
        </nav>
        {view === "open" && rows.length > 1 && (
          <form action={markAllEmailFailuresHandled}>
            <Button type="submit" variant="secondary" size="sm">
              Mark all handled
            </Button>
          </form>
        )}
      </div>
      {rows.length ? (
        <div className="-mx-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>What went wrong</TableHead>
                <TableHead className="text-right">{view === "open" ? "" : "Handled"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    <LocalTime value={r.createdAt} style="datetime" />
                  </TableCell>
                  <TableCell className="break-all">{r.recipient}</TableCell>
                  <TableCell>{r.subject}</TableCell>
                  <TableCell className="max-w-[320px] text-text-secondary">{r.error}</TableCell>
                  <TableCell className="text-right">
                    {view === "open" ? (
                      <form action={markEmailFailureHandled.bind(null, r.id)}>
                        <Button type="submit" variant="ghost" size="sm">
                          Mark handled
                        </Button>
                      </form>
                    ) : (
                      <span className="type-small text-text-tertiary">
                        {r.handledBy ?? "Someone"}, {r.handledAt ? <LocalTime value={r.handledAt} /> : null}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState art={<CheckIcon />} title={view === "open" ? "Every email went out" : "Nothing handled yet"}>
          {view === "open" ? "If PsychMind can't send an email, it will appear here." : "Failures you mark as handled will appear here."}
        </EmptyState>
      )}
    </>
  );
}
