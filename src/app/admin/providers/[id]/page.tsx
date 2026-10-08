import { ExternalLinkIcon, FileTextIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DecisionPanel } from "@/components/admin/decision-panel";
import { STATUS_BADGE } from "@/components/admin/provider-table";
import { PageHeader } from "@/components/app/page-header";
import { ProviderProfileView } from "@/components/provider/profile-view";
import { Badge } from "@/components/ui/badge";
import { fileUrl, toProfileView } from "@/lib/provider/state";
import { stateName } from "@/lib/taxonomy";
import { providerHistory, providerOwnerEmail } from "@/server/admin/data";
import { loadProviderStateById } from "@/server/provider/data";

export const metadata: Metadata = { title: "Review provider — PsychMind admin" };

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

// Everything an admin needs to verify a provider: licenses with their
// documents (each view is audited), the NPI, the profile as patients would
// see it, and the decision history.
export default async function AdminProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await loadProviderStateById(id);
  if (!state) notFound();
  const [email, history] = await Promise.all([providerOwnerEmail(id), providerHistory(id)]);
  const name = [state.firstName, state.lastName].filter(Boolean).join(" ") || "(no name yet)";
  const badge = STATUS_BADGE[state.status];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Verification queue", href: "/admin" }, { label: name }]}
        title={name}
        description={email ?? undefined}
        actions={<Badge variant={badge.variant}>{badge.label}</Badge>}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,440px)_1fr]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-6">
            <h2 className="type-title text-text-primary">Decision</h2>
            <DecisionPanel profileId={state.id} status={state.status} needsReview={state.needsReview} />
            {state.reviewNote && (
              <p className="rounded-field bg-warm-50 p-3 type-small text-text-secondary">
                <span className="font-medium text-text-primary">Last note: </span>
                {state.reviewNote}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-6">
            <h2 className="type-title text-text-primary">Credentials</h2>
            <dl className="grid grid-cols-2 gap-3 type-small">
              <dt className="text-text-tertiary">NPI</dt>
              <dd className="flex items-center gap-2 font-medium text-text-primary">
                {state.npiNumber || "—"}
                {state.npiNumber && (
                  <a
                    href={`https://npiregistry.cms.hhs.gov/provider-view/${state.npiNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-tertiary hover:text-text-primary"
                    aria-label="Look up this NPI in the NPPES registry"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </a>
                )}
              </dd>
              <dt className="text-text-tertiary">Experience</dt>
              <dd className="text-text-primary">{state.yearsExperience != null ? `${state.yearsExperience} years` : "—"}</dd>
              <dt className="text-text-tertiary">Title</dt>
              <dd className="text-text-primary">{state.titleCredentials || "—"}</dd>
            </dl>
            <ul className="flex flex-col gap-3">
              {state.licenses.map((l) => (
                <li key={l.id} className="flex flex-col gap-2 rounded-field border border-warm-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="type-small font-semibold text-text-primary">{stateName(l.state)}</p>
                    <Badge variant={l.status === "verified" ? "success" : l.status === "rejected" ? "danger" : "info"}>{l.status}</Badge>
                  </div>
                  <p className="type-small text-text-secondary">
                    License #{l.licenseNumber} · {l.issuingBody}
                  </p>
                  {l.document ? (
                    <a
                      href={fileUrl(l.document.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 type-small font-medium text-text-primary underline underline-offset-2"
                    >
                      <FileTextIcon aria-hidden className="size-4" />
                      {l.document.fileName}
                    </a>
                  ) : (
                    <p className="type-small text-destructive">No document uploaded</p>
                  )}
                </li>
              ))}
              {!state.licenses.length && <p className="type-small text-text-tertiary">No licenses yet.</p>}
            </ul>
          </section>

          <section className="flex flex-col gap-3 rounded-card border border-warm-200 bg-white p-6">
            <h2 className="type-title text-text-primary">History</h2>
            <ol className="flex flex-col gap-2">
              {history.map((h, i) => (
                <li key={i} className="flex flex-col type-small">
                  <span className="text-text-primary">
                    {h.action.replace(/^provider\./, "").replace(/_/g, " ")}
                    {h.actor ? ` · ${h.actor}` : ""}
                  </span>
                  <span className="text-text-placeholder">{dateFmt.format(h.createdAt)}</span>
                </li>
              ))}
              {!history.length && <li className="type-small text-text-tertiary">No activity yet.</li>}
            </ol>
          </section>
        </div>

        <section aria-label="Public profile preview">
          <ProviderProfileView profile={toProfileView(state)} mode="preview" />
        </section>
      </div>
    </>
  );
}
