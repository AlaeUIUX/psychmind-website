import { eq } from "drizzle-orm";
import { CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { PageHeader } from "@/components/app/page-header";
import { ProviderProfileView } from "@/components/provider/profile-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { providerProfile } from "@/db/schema";
import { isListed } from "@/lib/billing";
import { toProfileView } from "@/lib/provider/state";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";
import { providerOverview } from "@/server/provider/status";

export const metadata: Metadata = { title: "Dashboard — PsychMind" };

// Provider home: where they stand (profile → verification → listing → live)
// and their profile as patients will see it.
export default async function ProviderHome() {
  const { user } = await requireRole("provider", "/provider");
  const state = await loadProviderState(user.id);
  const [row] = await db.select({ pastDueSince: providerProfile.pastDueSince }).from(providerProfile).where(eq(providerProfile.id, state.id));
  const { listing } = await providerOverview(user.id, state, row?.pastDueSince ?? null);
  const live = isListed(listing);

  // TODO(client): checklist copy.
  const steps = [
    { label: "Build your profile", done: state.status !== "draft", href: `/provider/onboarding/${state.onboardingStep}` },
    { label: "Get verified by our team", done: state.status === "approved", href: null },
    { label: "Activate your listing", done: listing === "live" || listing === "grace" || listing === "paused", href: "/provider/billing" },
    { label: "Appear in search", done: live, href: null },
  ];
  const statusBadge = live
    ? { variant: "success" as const, label: "Live" }
    : state.status === "submitted"
      ? { variant: "info" as const, label: "In review" }
      : state.status === "approved"
        ? { variant: "warning" as const, label: "Not listed" }
        : { variant: "neutral" as const, label: "Not visible yet" };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        title={`Welcome${state.firstName ? `, ${state.firstName}` : ""}`}
        description="Your profile, verification and listing in one place."
        actions={
          <Button asChild variant="secondary">
            <Link href="/provider/profile">Edit profile</Link>
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <section aria-labelledby="progress-title" className="flex h-fit flex-col gap-5 rounded-card border border-warm-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="progress-title" className="type-title text-text-primary">
              Getting listed
            </h2>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <ol className="flex flex-col gap-4">
            {steps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    step.done ? "bg-warm-900 text-white" : "border border-warm-300 text-text-tertiary",
                  )}
                >
                  {step.done ? <CheckIcon aria-hidden className="size-3.5" /> : i + 1}
                </span>
                <span className={cn("type-small", step.done ? "text-text-tertiary line-through decoration-warm-300" : "text-text-primary")}>
                  {step.label}
                  <span className="sr-only">{step.done ? " (done)" : ""}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Profile preview" className="flex flex-col gap-3">
          <p className="type-small text-text-tertiary">This is how patients will see your profile.</p>
          <ProviderProfileView profile={toProfileView(state)} mode="preview" />
        </section>
      </div>
    </>
  );
}
