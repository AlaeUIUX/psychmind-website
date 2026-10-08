import { BadgeCheckIcon, CircleDollarSignIcon, CircleXIcon, FileTextIcon, ShieldIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { BASE_PLAN } from "@/lib/billing";
import { stepIndex } from "@/lib/provider/steps";
import { requireRole } from "@/server/auth/session";
import { ensureProfile } from "@/server/provider/data";

export const metadata: Metadata = { title: "For providers — PsychMind", robots: { index: false } };

const featureIcons = [CircleXIcon, FileTextIcon, CircleDollarSignIcon, ShieldIcon];

// Figma P0 "Provider pricing intro": what it costs and what happens next,
// before the wizard. No payment is taken here (that's after verification).
export default async function OnboardingIntroPage() {
  const { user } = await requireRole("provider", "/provider/onboarding");
  const profile = await ensureProfile(user.id);
  if (profile.status !== "draft" && profile.status !== "changes_requested") redirect("/provider");
  const started = stepIndex(profile.onboardingStep) > 0;

  return (
    <div className="flex min-h-svh flex-col bg-muted">
      <header className="flex items-center px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/home/logo.svg" alt="" width={28} height={28} />
          <span className="font-display text-lg text-warm-900">PsychMind</span>
        </Link>
      </header>
      <main className="flex flex-1 justify-center px-4 pb-10 sm:px-8">
        <div className="grid w-full max-w-[1100px] overflow-hidden rounded-card border border-warm-200 bg-white shadow-card md:grid-cols-2">
          <section className="flex flex-col gap-7 p-6 sm:p-10">
            <div className="flex flex-col gap-3">
              <p className="type-small font-medium text-text-tertiary">For providers</p>
              <h1 className="type-h3 text-text-primary">Reach people who are ready to start</h1>
              <p className="type-body text-text-tertiary">
                Psychmind connects verified mental health professionals with people actively looking for help.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-card surface-soft p-6">
              <p className="flex items-baseline gap-1.5">
                <span className="type-stat text-text-primary">{BASE_PLAN.priceLabel}</span>
                <span className="type-body text-text-tertiary">{BASE_PLAN.period}</span>
              </p>
              <p className="type-small font-medium text-text-primary">{BASE_PLAN.summary}</p>
              <p className="type-small text-text-tertiary">{BASE_PLAN.blurb}</p>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {BASE_PLAN.features.map((f, i) => {
                  const Icon = featureIcons[i] ?? BadgeCheckIcon;
                  return (
                    <li key={f} className="flex items-center gap-2 type-small text-text-secondary">
                      <Icon aria-hidden className="size-4 shrink-0 text-warm-600" />
                      {f}
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="type-small text-text-tertiary">
              Takes about 20 minutes · Goes live after verification{" "}
              <span className="font-medium text-brand-primary">1-2 days</span>
            </p>

            <div className="flex flex-col gap-3">
              <Button asChild variant="brand" size="lg" fullWidth>
                <Link href={`/provider/onboarding/${started ? profile.onboardingStep : "identity"}`}>
                  {started ? "Continue where you left off" : "Get started"}
                  <CircleArrowIcon />
                </Link>
              </Button>
              <p className="text-center type-caption text-text-placeholder">
                By clicking “Get started”, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-2">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </section>
          <div className="relative hidden bg-warm-100 md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/login/login-illustration.jpg" alt="" className="absolute inset-0 size-full object-cover" />
          </div>
        </div>
      </main>
    </div>
  );
}
