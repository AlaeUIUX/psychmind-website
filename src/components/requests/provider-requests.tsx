"use client";

import { cn } from "cn";
import { InboxIcon, MailIcon, PhoneIcon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/empty-state";
import { LocalTime } from "@/components/app/local-time";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatLabel, sessionTypeLabel } from "@/lib/requests";
import { setRequestContacted } from "@/server/requests/actions";
import type { ProviderRequest } from "@/server/requests/data";

// A provider's session requests. They reply outside PsychMind (by email or
// phone); "Contacted" is only for their own bookkeeping. TODO(client): copy.

function RequestRow({ r, onContacted }: { r: ProviderRequest; onContacted: (contacted: boolean) => void }) {
  const contacted = r.status === "contacted";
  return (
    <li className={cn("flex flex-col gap-4 rounded-card border bg-white p-4 sm:p-5", contacted ? "border-warm-200" : "border-blue-200")} data-testid="provider-request">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-2 type-ui-heading text-text-primary">
            {r.name}
            {!contacted && <Badge variant="info">New</Badge>}
            <Badge variant="neutral">{r.fromAccount ? "PsychMind account" : "Guest"}</Badge>
          </p>
          <p className="type-ui-small text-text-secondary">
            {sessionTypeLabel(r.sessionType)} · {formatLabel(r.format)} · <LocalTime value={r.createdAt} style="datetime" />
          </p>
        </div>
        <label className="flex items-center gap-2.5 type-ui-label text-text-secondary">
          <Switch checked={contacted} onCheckedChange={onContacted} aria-label={`Mark ${r.name} as contacted`} />
          Contacted
        </label>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 type-ui-body">
        <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-blue-700 underline-offset-4 hover:underline">
          <MailIcon className="size-4" />
          {r.email}
        </a>
        {r.phone && (
          <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1.5 text-blue-700 underline-offset-4 hover:underline">
            <PhoneIcon className="size-4" />
            {r.phone}
          </a>
        )}
      </div>
      {r.note && <p className="rounded-xl bg-warm-50 p-3.5 type-ui-body whitespace-pre-line text-text-secondary ring-1 ring-warm-100 ring-inset">{r.note}</p>}
    </li>
  );
}

export function ProviderRequests({ requests }: { requests: ProviderRequest[] }) {
  const [list, setStatus] = useOptimistic(requests, (current, { id, contacted }: { id: string; contacted: boolean }) =>
    current.map((r) => (r.id === id ? { ...r, status: contacted ? ("contacted" as const) : ("new" as const) } : r)),
  );
  const [, startTransition] = useTransition();
  const mark = (id: string, contacted: boolean) =>
    startTransition(async () => {
      setStatus({ id, contacted });
      const res = await setRequestContacted(id, contacted);
      if (!res.ok) toast.error("That didn't save. Please try again.");
    });

  if (!requests.length) {
    return (
      <EmptyState art={<InboxIcon className="size-7" />} title="No requests yet">
        When someone requests a session, it appears here and in your email.
      </EmptyState>
    );
  }

  const fresh = list.filter((r) => r.status === "new");
  const render = (items: ProviderRequest[]) =>
    items.length ? (
      <ul className="flex flex-col gap-3">
        {items.map((r) => (
          <RequestRow key={r.id} r={r} onContacted={(c) => mark(r.id, c)} />
        ))}
      </ul>
    ) : (
      <EmptyState art={<InboxIcon className="size-7" />} title="You're all caught up">
        Every request has been marked as contacted.
      </EmptyState>
    );

  return (
    <Tabs defaultValue={fresh.length ? "new" : "all"} className="flex flex-col gap-4">
      <TabsList>
        <TabsTrigger value="new">New ({fresh.length})</TabsTrigger>
        <TabsTrigger value="all">All ({list.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="new">{render(fresh)}</TabsContent>
      <TabsContent value="all">{render(list)}</TabsContent>
    </Tabs>
  );
}
