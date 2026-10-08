import {
  BadgeCheckIcon,
  CameraIcon,
  CircleDollarSignIcon,
  CircleXIcon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  HashIcon,
  ShieldIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HoverArrow } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { BASE_PLAN } from "@/lib/billing";
import { sectionStatuses } from "@/lib/provider/completeness";
import { ONBOARDING_STEPS, stepIndex } from "@/lib/provider/steps";
import { requireRole } from "@/server/auth/session";
import { loadProviderState } from "@/server/provider/data";

export const metadata: Metadata = { title: "For providers — PsychMind", robots: { index: false } };

const featureIcons = [CircleXIcon, BadgeCheckIcon, CircleDollarSignIcon, ShieldIcon];

// TODO(client): "How it works" and "What you'll need" are new copy.
const timeline = [
  { title: "Build your profile", body: "Your story, expertise, fees and locations.", badge: "~20 min" },
  { title: "License verification", body: "Our team checks every license by hand.", badge: "1–2 business days" },
  { title: "Activate your listing", body: "Start your plan and appear in search.", badge: "Same day" },
];

const needs = [
  { icon: CameraIcon, text: "A recent, clear photo of you" },
  { icon: HashIcon, text: "Your NPI number" },
  { icon: FileTextIcon, text: "License number and document for each state (PDF, JPG or PNG, up to 10 MB)" },
  { icon: GraduationCapIcon, text: "Degrees and training (optional)" },
  { icon: CircleDollarSignIcon, text: "Your session fees (optional)" },
];

// Figma P0 "Provider pricing intro", rebuilt: what it costs, what happens,
// and what to have ready — nothing is charged here (payment comes after
// verification).
export default async function OnboardingWelcomePage() {
  const { user } = await requireRole("provider", "/provider/onboarding");
  const state = await loadProviderState(user.id);
  if (state.status === "submitted") redirect("/provider/onboarding/submitted");
  if (state.status !== "draft" && state.status !== "changes_requested") redirect("/provider");

  const started = stepIndex(state.onboardingStep) > 0;
  const done = sectionStatuses(state).filter((s) => s.complete).length;
  const percent = Math.round((done / 8) * 100);
  const resume = ONBOARDING_STEPS.find((s) => s.key === state.onboardingStep);

  return (
    <div className="grid items-start gap-10 py-4 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-16 lg:py-10">
      <section className="flex flex-col gap-7">
        {started && resume && (
          <div className="flex animate-ui-enter items-center justify-between gap-4 rounded-xl bg-white p-4 ring-1 ring-warm-200">
            <div className="flex flex-col gap-1.5">
              <p className="type-ui-label text-warm-900">
                Welcome back{state.firstName ? `, ${state.firstName}` : ""}. You&apos;re {percent}% done.
              </p>
              <div className="h-1 w-40 overflow-hidden rounded-full bg-warm-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
              </div>
            </div>
            <Button asChild size="sm" className="h-9 shrink-0">
              <Link href={`/provider/onboarding/${resume.key}`}>
                Continue: {resume.label}
                <HoverArrow />
              </Link>
            </Button>
          </div>
        )}

        <div className="flex animate-ui-enter flex-col gap-3" style={{ "--i": 1 } as React.CSSProperties}>
          <p className="type-ui-label text-warm-500">For providers</p>
          <h1 className="type-ui-display text-warm-900">Reach people who are ready to start</h1>
          <p className="type-ui-body text-[15px] leading-6 text-warm-600">
            Psychmind connects verified mental health professionals with people actively looking for help.
          </p>
        </div>

        <div className="flex animate-ui-enter flex-col gap-5 rounded-2xl border border-warm-200 bg-white p-6 shadow-[0_1px_2px_rgb(28_25_23/0.04),0_16px_32px_-24px_rgb(28_25_23/0.25)]" style={{ "--i": 2 } as React.CSSProperties}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="flex items-baseline gap-1.5">
                <span className="font-mono text-[40px] leading-none font-semibold tracking-[-0.04em] text-warm-900">{BASE_PLAN.priceLabel}</span>
                <span className="type-ui-small text-warm-500">{BASE_PLAN.period}</span>
              </p>
              <p className="type-ui-label text-warm-800">{BASE_PLAN.summary}</p>
            </div>
            <span className="rounded-md bg-emerald-50 px-2 py-1 type-ui-caption font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
              {/* TODO(client) */}
              Nothing to pay today
            </span>
          </div>
          <p className="type-ui-small text-warm-600">{BASE_PLAN.blurb}</p>
          <ul className="grid gap-x-4 gap-y-2.5 border-t border-warm-100 pt-4 sm:grid-cols-2">
            {BASE_PLAN.features.map((f, i) => {
              const Icon = featureIcons[i] ?? BadgeCheckIcon;
              return (
                <li key={f} className="flex items-center gap-2 type-ui-small text-warm-700">
                  <Icon aria-hidden className="size-4 shrink-0 text-warm-500" />
                  {f}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex animate-ui-enter flex-col gap-4" style={{ "--i": 3 } as React.CSSProperties}>
          <p className="flex items-center gap-2 type-ui-small text-warm-600">
            <ClockIcon aria-hidden className="size-4 text-warm-500" />
            Takes about 20 minutes · Goes live after verification <span className="font-medium text-blue-600">1-2 days</span>
          </p>
          <Button asChild className="h-11 w-full px-6 text-[15px] sm:w-auto sm:self-start">
            <Link href={`/provider/onboarding/${started ? state.onboardingStep : "identity"}`}>
              {started ? "Continue where you left off" : "Get started"}
              <HoverArrow />
            </Link>
          </Button>
          <p className="type-ui-caption text-warm-500">
            By clicking “Get started”, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-warm-900">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-warm-900">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>

      <aside className="flex flex-col gap-5">
        <div className="animate-ui-enter rounded-2xl border border-warm-200 bg-white p-6" style={{ "--i": 2 } as React.CSSProperties}>
          <h2 className="type-ui-heading text-warm-900">How it works</h2>
          <ol className="mt-5 flex flex-col">
            {timeline.map((t, i) => (
              <li key={t.title} className="relative flex gap-4 pb-6 last:pb-0">
                {i < timeline.length - 1 && <span aria-hidden className="absolute top-8 bottom-1 left-[13px] w-px bg-warm-200" />}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warm-900 type-ui-mono text-[12px] text-white">{i + 1}</span>
                <div className="flex flex-1 flex-col gap-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="type-ui-label text-warm-900">{t.title}</span>
                    <span className="rounded-md bg-warm-100 px-1.5 py-0.5 type-ui-caption text-warm-600">{t.badge}</span>
                  </div>
                  <p className="type-ui-small text-warm-600">{t.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="animate-ui-enter rounded-2xl border border-warm-200 bg-white p-6" style={{ "--i": 3 } as React.CSSProperties}>
          <h2 className="type-ui-heading text-warm-900">What you&apos;ll need</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {needs.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 type-ui-small text-warm-700">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-warm-100 text-warm-600">
                  <Icon aria-hidden className="size-3.5" />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
