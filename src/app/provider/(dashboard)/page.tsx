import { eq } from "drizzle-orm";
import { ArrowUpRightIcon, CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { PageHeader } from "@/components/app/page-header";
import { ProviderProfileView } from "@/components/provider/profile-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { providerProfile } from "@/db/schema";
import { isListed, stripeConfigured } from "@/lib/billing";
import { profilePath } from "@/lib/provider/links";
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
  // In the directory now (approval alone lists them until billing is connected).
  const inDirectory = state.status === "approved" && (live || !stripeConfigured());

  // TODO(client): checklist copy.
  const steps = [
    { label: "Build your profile", done: state.status !== "draft", href: `/provider/onboarding/${state.onboardingStep}` },
    { label: "Get verified by our team", done: state.status === "approved", href: null },
    { label: "Activate your listing", done: listing === "live" || listing === "grace" || listing === "paused", href: "/provider/billing" },
    { label: "Appear in search", done: live, href: null },
  ];
  const current = steps.findIndex((s) => !s.done);
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
          {/* Same timeline as the "submitted" screen: done steps get a green
              check (no strikethrough), the current one a pulsing dot. */}
          <ol className="flex flex-col">
            {steps.map((step, i) => {
              const status = step.done ? "done" : i === current ? "current" : "todo";
              return (
                <li key={step.label} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {i < steps.length - 1 && (
                    <span aria-hidden className={cn("absolute top-7 bottom-0.5 left-[11px] w-px", step.done ? "bg-emerald-200" : "bg-warm-200")} />
                  )}
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full",
                      status === "done" && "bg-emerald-600 text-white",
                      status === "current" && "border-2 border-amber-500 bg-white",
                      status === "todo" && "border-2 border-warm-200 bg-white",
                    )}
                  >
                    {status === "done" && <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />}
                    {status === "current" && <span className="size-2 animate-pulse rounded-full bg-amber-500" />}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                    <span className={cn("type-small font-medium", status === "todo" ? "text-text-tertiary" : "text-text-primary")}>{step.label}</span>
                    {status === "current" && step.href && (
                      <Link href={step.href} className="w-fit type-caption font-medium text-blue-700 underline-offset-4 hover:underline">
                        Continue &rarr;
                      </Link>
                    )}
                  </div>
                  <span className="sr-only">{status === "done" ? "Done" : status === "current" ? "In progress" : "Not started"}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-label="Profile preview" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="type-small text-text-tertiary">This is how patients will see your profile.</p>
            {inDirectory && (
              <Button asChild variant="ghost" size="sm">
                <a href={profilePath(state)} target="_blank" rel="noopener">
                  {/* TODO(client): copy */}
                  View your public profile
                  <ArrowUpRightIcon />
                </a>
              </Button>
            )}
          </div>
          <ProviderProfileView profile={toProfileView(state)} mode="preview" />
        </section>
      </div>
    </>
  );
}
