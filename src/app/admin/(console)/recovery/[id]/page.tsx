import { FileTextIcon, ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecoveryDecision } from "@/components/admin/recovery-decision";
import { STATUS_BADGE } from "@/components/admin/provider-table";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { RECOVERY_BADGE } from "@/lib/recovery";
import { stateName } from "@/lib/taxonomy";
import { getRecoveryRequest } from "@/server/account/recovery";
import { isAdminEmail } from "@/server/auth/admin-emails";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Account recovery — PsychMind admin" };

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-text-tertiary">{label}</dt>
      <dd className="min-w-0 break-words text-text-primary">{children}</dd>
    </>
  );
}

// One request: what they told us, the photo ID (each view is audited), and
// the account their email matched, side by side so they can be compared.
export default async function AdminRecoveryRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("admin", `/admin/recovery/${id}`);
  const found = await getRecoveryRequest(id);
  if (!found) notFound();
  const { request, account, resolver } = found;
  const badge = RECOVERY_BADGE[request.status];

  const blockedReason = !account
    ? "No account uses this email, so there's nothing to move. Decline with a note: they may have typed the wrong address."
    : account.role === "admin"
      ? "This is an admin account. Admins are recovered from Admins → Reset access, not here."
      : isAdminEmail(request.contactEmail)
        ? "The new address is on the admin list and can't be used for this account."
        : undefined;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Account recovery", href: "/admin/recovery" }, { label: request.fullName }]}
        title={request.fullName}
        description={`Asked ${dateFmt.format(request.createdAt)}${request.signedIn ? " while logged in" : ""}`}
        actions={<Badge variant={badge.variant}>{badge.label}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-6">
            <h2 className="type-title text-text-primary">What they told us</h2>
            <dl className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-4 gap-y-3 type-small">
              <Item label="Name">{request.fullName}</Item>
              <Item label="They are a">{request.claimedRole === "provider" ? "Provider" : "Patient"}</Item>
              <Item label="Account email">{request.accountEmail}</Item>
              <Item label="New email">{request.contactEmail}</Item>
              {request.licenseNumber && <Item label="License number">{request.licenseNumber}</Item>}
              <Item label="Details">{request.details ? <span className="whitespace-pre-line">{request.details}</span> : "—"}</Item>
            </dl>
            {request.idStorageKey ? (
              <a
                href={`/api/admin/recovery/${request.id}/document`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 self-start type-small font-medium text-text-primary underline underline-offset-2"
              >
                <FileTextIcon aria-hidden className="size-4" />
                Photo ID ({request.idFileName})
              </a>
            ) : (
              <p className="type-small text-text-tertiary">{request.status === "open" ? "No ID attached." : "The photo ID was deleted when this request closed."}</p>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-6">
            <h2 className="type-title text-text-primary">Decision</h2>
            {request.status === "open" ? (
              <RecoveryDecision
                id={request.id}
                newEmail={request.contactEmail}
                canMove={!blockedReason}
                blockedReason={blockedReason}
                twoFactorEnabled={account?.twoFactorEnabled === true}
              />
            ) : (
              <div className="flex flex-col gap-2 type-small text-text-secondary">
                <p>
                  {request.status === "completed" ? "The account was moved to the new email." : "Declined. Nothing was changed."}
                  {resolver ? ` By ${resolver}` : ""}
                  {request.resolvedAt ? `, ${dateFmt.format(request.resolvedAt)}.` : "."}
                </p>
                {request.resolutionNote && (
                  <p className="rounded-field bg-warm-50 p-3">
                    <span className="font-medium text-text-primary">Note sent: </span>
                    {request.resolutionNote}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <section className="flex flex-col gap-4 self-start rounded-card border border-warm-200 bg-white p-6">
          <h2 className="type-title text-text-primary">The account</h2>
          {account ? (
            <>
              <dl className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-4 gap-y-3 type-small">
                <Item label="Name on account">{account.name}</Item>
                <Item label="Email now">{account.email}</Item>
                <Item label="Role">{account.role === "provider" ? "Provider" : account.role === "admin" ? "Admin" : "Patient"}</Item>
                <Item label="Created">{dateFmt.format(account.createdAt)}</Item>
                <Item label="Two-step login">
                  {account.twoFactorEnabled ? (
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheckIcon aria-hidden className="size-4 text-emerald-600" />
                      On (they could have used their authenticator)
                    </span>
                  ) : (
                    "Off"
                  )}
                </Item>
              </dl>
              {account.profile && (
                <div className="flex flex-col gap-3 border-t border-warm-200 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/admin/providers/${account.profile.id}`} className="type-small font-semibold text-text-primary hover:underline">
                      {[account.profile.firstName, account.profile.lastName].filter(Boolean).join(" ") || "Provider profile"}
                    </Link>
                    <Badge variant={STATUS_BADGE[account.profile.status].variant}>{STATUS_BADGE[account.profile.status].label}</Badge>
                  </div>
                  {account.licenses.length ? (
                    <ul className="flex flex-col gap-1 type-small text-text-secondary">
                      {account.licenses.map((l) => (
                        <li key={l.state}>
                          {stateName(l.state)} · License #{l.licenseNumber}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="type-small text-text-tertiary">No licenses on file.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="type-small text-text-tertiary">
              No account uses <span className="font-medium text-text-primary">{request.accountEmail}</span>
              {request.status === "completed" ? " anymore." : "."}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
