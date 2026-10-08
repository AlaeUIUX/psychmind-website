import { BellIcon, ChevronRightIcon, EyeIcon, PencilLineIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmittedPreview } from "@/components/onboarding/submitted-preview";
import { Button } from "@/components/ui/button";
import { toProfileView } from "@/lib/provider/state";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";

export const metadata: Metadata = { title: "Profile submitted — PsychMind", robots: { index: false } };

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}•••@${domain}`;
}

// After "Submit for verification" (not in Figma). Calm, earned, no confetti:
// a check that draws itself, one breath of the portal ring, and a timeline of
// what happens next. TODO(client): all copy.
export default async function SubmittedPage() {
  const { user } = await requireRole("provider", "/provider/onboarding/submitted");
  const state = await loadProviderState(user.id);
  if (state.status === "draft" || state.status === "changes_requested") redirect(`/provider/onboarding/${state.onboardingStep}`);
  if (state.status !== "submitted") redirect("/provider");

  const steps = [
    { title: "Profile submitted", meta: dateFmt.format(new Date()), state: "done" as const },
    { title: "License verification", meta: "In review · usually 1–2 business days", state: "current" as const },
    { title: "Activate your listing", meta: "After you're verified", state: "todo" as const },
  ];

  return (
    <div className="grid items-start gap-10 py-4 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-14 lg:py-8">
      <section className="flex flex-col gap-7">
        <div className="flex flex-col gap-5">
          <div className="relative size-14">
            <span aria-hidden className="absolute inset-0 animate-[portal-breathe_2.4s_cubic-bezier(0.37,0,0.63,1)_1] rounded-full border border-emerald-400" />
            <span className="relative flex size-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
              <svg viewBox="0 0 24 24" className="size-7 text-emerald-600" aria-hidden>
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="[stroke-dasharray:24] [stroke-dashoffset:24] motion-safe:animate-[draw-on_700ms_var(--ease-out-soft)_300ms_forwards] motion-reduce:[stroke-dashoffset:0]"
                />
              </svg>
            </span>
          </div>
          <div className="flex animate-ui-enter flex-col gap-3" style={{ "--i": 2 } as React.CSSProperties}>
            <h1 className="type-ui-display text-warm-900">Submitted. We&apos;re reviewing your profile.</h1>
            <p className="type-ui-body text-[15px] leading-6 text-warm-600">
              We verify every provider by hand. You&apos;ll hear from us at <span className="font-medium text-warm-900">{maskEmail(user.email)}</span> within 1–2 business days.
            </p>
          </div>
        </div>

        <ol className="flex animate-ui-enter flex-col rounded-2xl border border-warm-200 bg-white p-6" style={{ "--i": 3 } as React.CSSProperties}>
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
              {i < steps.length - 1 && <span aria-hidden className="absolute top-7 bottom-1 left-[11px] w-px bg-warm-200" />}
              <span
                className={
                  s.state === "done"
                    ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
                    : s.state === "current"
                      ? "flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 bg-white"
                      : "flex size-6 shrink-0 rounded-full border-2 border-warm-200 bg-white"
                }
              >
                {s.state === "done" && (
                  <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {s.state === "current" && <span className="size-2 animate-pulse rounded-full bg-amber-500" />}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="type-ui-label text-warm-900">{s.title}</span>
                <span className={s.state === "done" ? "type-ui-mono text-warm-500" : "type-ui-small text-warm-500"}>{s.meta}</span>
              </div>
              <span className="sr-only">{s.state === "done" ? "Done" : s.state === "current" ? "In progress" : "Not started"}</span>
            </li>
          ))}
        </ol>

        <div className="animate-ui-enter overflow-hidden rounded-2xl border border-warm-200 bg-white" style={{ "--i": 4 } as React.CSSProperties}>
          <p className="border-b border-warm-100 px-5 py-3 type-ui-label text-warm-800">While you wait</p>
          {[
            { href: "/provider", icon: EyeIcon, title: "Preview your public profile", body: "See exactly what patients will see." },
            { href: "/provider/profile", icon: PencilLineIcon, title: "Polish your profile", body: "You can keep editing anything except your licenses." },
            { href: "/provider/settings", icon: BellIcon, title: "Account settings", body: "Your email and sign-in details." },
          ].map(({ href, icon: Icon, title, body }) => (
            <Link key={href + title} href={href} className="group flex items-center gap-3 border-b border-warm-100 px-5 py-3.5 last:border-0 hover:bg-warm-50">
              <span className="flex size-8 items-center justify-center rounded-lg bg-warm-100 text-warm-600">
                <Icon aria-hidden className="size-4" />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="type-ui-label text-warm-900">{title}</span>
                <span className="type-ui-caption text-warm-500">{body}</span>
              </span>
              <ChevronRightIcon aria-hidden className="size-4 text-warm-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="h-10">
            <Link href="/provider">Go to dashboard</Link>
          </Button>
          <a href="mailto:support@psychmind.org" className="type-ui-small text-warm-600 underline-offset-4 hover:text-warm-900 hover:underline">
            Questions? Email support
          </a>
        </div>
      </section>

      <aside className="hidden h-[calc(100svh-9rem)] lg:sticky lg:top-22 lg:block" aria-label="Your submitted profile">
        <SubmittedPreview profile={toProfileView(state)} />
      </aside>
    </div>
  );
}
