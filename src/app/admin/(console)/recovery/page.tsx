import { cn } from "cn";
import type { Metadata } from "next";
import Link from "next/link";
import { RECOVERY_BADGE } from "@/lib/recovery";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { DoodleCheck } from "@/components/ui/doodles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listRecoveryRequests } from "@/server/account/recovery";

export const metadata: Metadata = { title: "Account recovery — PsychMind admin" };

// People who can't get into their email and have no authenticator. Oldest
// first; each one is checked by a person before the account moves.
// TODO(client): copy.

function waiting(since: Date) {
  const hours = Math.floor((Date.now() - since.getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)} days`;
}

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function AdminRecoveryPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view === "closed" ? "closed" : "open";
  const rows = await listRecoveryRequests(view);
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Admin" }, { label: "Account recovery" }]}
        title="Account recovery"
        description="People who lost access to their email. Check who they are before moving an account: compare a provider's ID with their license, and look for anything that doesn't add up."
      />
      <nav aria-label="Filter requests" className="mb-4 flex gap-1">
        {(["open", "closed"] as const).map((v) => (
          <Link
            key={v}
            href={v === "open" ? "/admin/recovery" : "/admin/recovery?view=closed"}
            aria-current={view === v ? "page" : undefined}
            className={cn(
              "rounded-pill px-3.5 py-1.5 type-small font-medium text-text-secondary transition-colors hover:bg-warm-100",
              view === v && "bg-warm-200/70 text-text-primary hover:bg-warm-200/70",
            )}
          >
            {v === "open" ? "Waiting" : "Closed"}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <div className="rounded-card border border-warm-200 bg-white p-2 sm:p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested by</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">{view === "open" ? "Waiting" : "Closed"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/admin/recovery/${r.id}`} className="flex flex-col font-medium text-text-primary hover:underline">
                      {r.fullName}
                      <span className="text-xs font-normal text-text-placeholder">{r.claimedRole === "provider" ? "Provider" : "Patient"}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="break-all">{r.accountEmail}</span>
                      <div className="flex flex-wrap gap-1">
                        {!r.matched && <Badge variant="warning">No such account</Badge>}
                        {r.hasId && <Badge variant="neutral">ID attached</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={RECOVERY_BADGE[r.status].variant}>{RECOVERY_BADGE[r.status].label}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {view === "open" ? waiting(r.createdAt) : r.resolvedAt ? dateFmt.format(r.resolvedAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState art={<DoodleCheck className="size-7" />} title={view === "open" ? "No one is waiting" : "Nothing closed yet"}>
          {view === "open" ? "Requests from people who can't access their email will appear here." : "Requests you complete or decline will appear here."}
        </EmptyState>
      )}
    </>
  );
}
