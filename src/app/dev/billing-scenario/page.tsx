import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { devScenarioAllowed, scenarioState, SCENARIO_PATIENT_EMAIL, SCENARIO_PROVIDER_EMAIL, type Stage } from "@/server/dev/billing-scenario";
import { buildAction, stageAction } from "./actions";

export const metadata: Metadata = { title: "Billing scenario — PsychMind", robots: { index: false } };
export const dynamic = "force-dynamic";

const STAGES: { stage: Stage; title: string; body: string }[] = [
  { stage: "active", title: "1. Active billing", body: "Jordan pays. Listed in search; Sam sees Jordan as usual." },
  { stage: "failed", title: "2. Invoice failed", body: "Payment failed today. Still listed for the 3-day grace period; Jordan's billing says \"Payment failed\"." },
  { stage: "lapsed", title: "3. Unavailable", body: "Still unpaid after 3 days. Out of search; Sam sees \"Currently unavailable\" and the profile link says so." },
];

// Local walk-through: a provider who stops paying, and a patient who saved
// them (server/dev/billing-scenario.ts). Never in production.
export default async function BillingScenarioPage() {
  if (!devScenarioAllowed()) notFound();
  const state = await scenarioState();
  const portal = process.env.NODE_ENV === "development" ? "http://app.localhost:3001" : "";

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="type-h3 text-text-primary">Billing scenario</h1>
        <p className="type-body text-text-tertiary">A provider stops paying; a patient who saved them sees them as unavailable.</p>
      </header>

      <p className="rounded-card border border-warm-200 bg-warm-50 p-4 type-small text-text-secondary">
        Stripe is {state.billingOn ? "configured" : "not configured"} here. Either way a lapsed subscription takes the provider out of the directory; the subscription is written by this page, not by Stripe.
      </p>

      <section className="flex flex-col gap-3 rounded-card border border-warm-200 bg-white p-5">
        <h2 className="type-ui-title text-text-primary">Accounts</h2>
        <dl className="grid gap-2 type-small sm:grid-cols-[160px_1fr]">
          <dt className="text-text-tertiary">Provider (Jordan Hale)</dt>
          <dd className="font-mono text-text-primary">{SCENARIO_PROVIDER_EMAIL}</dd>
          <dt className="text-text-tertiary">Patient (Sam Carter)</dt>
          <dd className="font-mono text-text-primary">{SCENARIO_PATIENT_EMAIL}</dd>
          <dt className="text-text-tertiary">Password</dt>
          <dd className="text-text-primary">The shared demo password (.data/demo-accounts.html)</dd>
        </dl>
        <form action={buildAction}>
          <Button type="submit" variant={state.built ? "secondary" : "default"}>
            {state.built ? "Rebuild from scratch" : "Build the scenario"}
          </Button>
        </form>
      </section>

      {state.built && (
        <>
          <section className="flex flex-col gap-3">
            {STAGES.map((s) => (
              <form key={s.stage} action={stageAction} className="flex items-center justify-between gap-4 rounded-card border border-warm-200 bg-white p-5">
                <input type="hidden" name="stage" value={s.stage} />
                <div className="flex flex-col gap-1">
                  <p className="flex items-center gap-2 type-ui-heading text-text-primary">
                    {s.title}
                    {state.stage === s.stage && <Badge variant="success">Current</Badge>}
                  </p>
                  <p className="type-small text-text-secondary">{s.body}</p>
                </div>
                <Button type="submit" variant="secondary" disabled={state.stage === s.stage}>
                  Go
                </Button>
              </form>
            ))}
          </section>

          <section className="flex flex-col gap-2 rounded-card border border-warm-200 bg-white p-5 type-small">
            <h2 className="type-ui-title text-text-primary">Where to look</h2>
            {state.href && (
              <a className="text-blue-700 underline underline-offset-4" href={`${portal}${state.href}`} target="_blank" rel="noopener">
                Jordan&apos;s profile link (anyone with it)
              </a>
            )}
            <a className="text-blue-700 underline underline-offset-4" href={`${portal}/account`} target="_blank" rel="noopener">
              Sam&apos;s saved providers (log in as Sam)
            </a>
            <a className="text-blue-700 underline underline-offset-4" href={`${portal}/provider/billing`} target="_blank" rel="noopener">
              Jordan&apos;s billing page (log in as Jordan)
            </a>
            <a className="text-blue-700 underline underline-offset-4" href={`${portal}/providers`} target="_blank" rel="noopener">
              Search results
            </a>
          </section>
        </>
      )}
    </main>
  );
}
