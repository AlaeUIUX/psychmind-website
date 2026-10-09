import { ArrowUpRightIcon, FlaskConicalIcon, UserRoundIcon } from "lucide-react";
import { LocalTime } from "@/components/app/local-time";
import { Badge } from "@/components/ui/badge";
import { formatLabel, sessionTypeLabel } from "@/lib/requests";
import type { MyRequest } from "@/server/requests/data";

// A patient's session requests (Figma R1 "My requests"): who, when, what was
// asked for, and whether the provider has been in touch. TODO(client): copy.

export function MyRequests({ requests }: { requests: MyRequest[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {requests.map((r) => (
        <li key={r.id} className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-4 sm:flex-row sm:items-center sm:p-5" data-testid="my-request">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {r.provider.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.provider.photoUrl} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-warm-100">
                <UserRoundIcon className="size-5 text-warm-400" />
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate type-ui-heading text-text-primary">{r.provider.name}</p>
              <p className="truncate type-ui-small text-text-secondary">
                {sessionTypeLabel(r.sessionType)} · {formatLabel(r.format)} · Sent <LocalTime value={r.createdAt} />
              </p>
              {r.isDemo && (
                <p className="flex items-center gap-1 type-ui-caption text-text-tertiary">
                  <FlaskConicalIcon className="size-3.5" />
                  Sample provider: no email was sent
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:justify-end">
            {r.status === "contacted" ? (
              <Badge variant="success">{r.provider.first} got in touch</Badge>
            ) : (
              <Badge variant="info">Waiting to hear back</Badge>
            )}
            <a
              href={r.provider.href}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 type-ui-label text-text-primary underline-offset-4 hover:underline"
            >
              Profile
              <ArrowUpRightIcon className="size-3.5" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
