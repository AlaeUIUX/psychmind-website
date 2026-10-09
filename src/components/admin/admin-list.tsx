"use client";

import { cn } from "cn";
import { KeyRoundIcon, LoaderCircleIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LocalTime } from "@/components/app/local-time";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resetAccess } from "@/server/admin/account-actions";
import type { AdminRow } from "@/server/admin/data";

// Admin → Admins: everyone on ADMIN_EMAILS and how far they are in setting
// up, with "Reset access" for someone who's locked out. TODO(client): copy.

type Status = { label: string; variant: "neutral" | "info" | "warning" | "success" | "danger"; dot: string };

function statusOf(row: AdminRow): Status {
  const a = row.account;
  if (!a) return { label: "Not created yet", variant: "neutral", dot: "bg-warm-400" };
  if (a.role !== "admin") return { label: "Admin from their next log-in", variant: "info", dot: "bg-sky-500" };
  if (a.mustChangePassword) {
    return a.tempPasswordExpiresAt && new Date(a.tempPasswordExpiresAt) < new Date()
      ? { label: "Temporary password expired", variant: "danger", dot: "bg-red-500" }
      : { label: "Invited", variant: "info", dot: "bg-sky-500" };
  }
  if (!a.twoFactorEnabled) return { label: "Needs authenticator", variant: "warning", dot: "bg-amber-500" };
  return { label: "Active", variant: "success", dot: "bg-emerald-500" };
}

function ResetAccess({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" size="sm" disabled={pending} className="h-8 px-3 text-[13px]">
          {pending ? <LoaderCircleIcon className="animate-spin" /> : <KeyRoundIcon />}
          Reset access
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset {name}&apos;s access?</AlertDialogTitle>
          <AlertDialogDescription>
            They&apos;ll get a new temporary password by email. Their current password, authenticator app and sessions stop working,
            and they set them up again at their next log-in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              start(async () => {
                const result = await resetAccess(id);
                setOpen(false);
                if (result.ok) toast.success(`New temporary password sent to ${name}`);
                else toast.error(result.error ?? "Something went wrong. Please try again.");
              });
            }}
          >
            Reset access
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminList({ rows, me }: { rows: AdminRow[]; me: string }) {
  return (
    <div className="rounded-card border border-warm-200 bg-white p-2 shadow-control sm:p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Admin</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Added</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const status = statusOf(row);
            const a = row.account;
            const isMe = a?.id === me;
            return (
              <TableRow key={row.email} data-testid="admin-row">
                <TableCell>
                  <span className="flex flex-col">
                    <span className="font-medium text-text-primary">
                      {a?.name ?? row.email}
                      {isMe && <span className="ml-1.5 type-ui-caption text-text-placeholder">(you)</span>}
                    </span>
                    <span className="type-ui-caption text-text-tertiary">{row.email}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex flex-col items-start gap-1">
                    <Badge variant={status.variant} className="gap-1.5">
                      <span aria-hidden className={cn("size-1.5 rounded-full", status.dot)} />
                      {status.label}
                    </Badge>
                    {a?.mustChangePassword && a.tempPasswordExpiresAt && status.variant === "info" && (
                      <span className="type-ui-caption text-text-placeholder">
                        Temporary password until <LocalTime value={a.tempPasswordExpiresAt} style="datetime" />
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="hidden text-text-tertiary sm:table-cell">{a ? <LocalTime value={a.createdAt} /> : "—"}</TableCell>
                <TableCell className="text-right">{a && a.role === "admin" && !isMe && <ResetAccess id={a.id} name={a.name} />}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
