import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { DoodleCheck } from "@/components/ui/doodles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProviderStatus } from "@/lib/provider/types";
import type { ProviderRow } from "@/server/admin/data";

export const STATUS_BADGE: Record<ProviderStatus, { variant: "neutral" | "info" | "warning" | "success" | "danger"; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  submitted: { variant: "info", label: "Waiting for review" },
  changes_requested: { variant: "warning", label: "Changes requested" },
  approved: { variant: "success", label: "Verified" },
  rejected: { variant: "danger", label: "Rejected" },
  suspended: { variant: "danger", label: "Suspended" },
};

function waiting(since: Date | null) {
  if (!since) return "—";
  const hours = Math.floor((Date.now() - since.getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)} days`;
}

export function ProviderTable({ rows, empty }: { rows: ProviderRow[]; empty: { title: string; body: string } }) {
  if (!rows.length) {
    return (
      <EmptyState art={<DoodleCheck className="size-7" />} title={empty.title}>
        {empty.body}
      </EmptyState>
    );
  }
  return (
    <div className="rounded-card border border-warm-200 bg-white p-2 sm:p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>States</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Waiting</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link href={`/admin/providers/${r.id}`} className="flex flex-col font-medium text-text-primary hover:underline">
                  {r.name}
                  <span className="text-xs font-normal text-text-placeholder">{r.email}</span>
                </Link>
              </TableCell>
              <TableCell>{r.states.join(", ") || "—"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={STATUS_BADGE[r.status].variant}>{STATUS_BADGE[r.status].label}</Badge>
                  {r.needsReview && <Badge variant="info">License update</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{r.status === "submitted" ? waiting(r.submittedAt) : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
