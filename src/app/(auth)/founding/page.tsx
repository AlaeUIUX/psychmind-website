import { CheckCircle2Icon, LinkIcon, SparklesIcon, UserRoundIcon } from "@/components/ui/hugeicons";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthTitle } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { FOUNDING_COOKIE } from "@/server/founding";

export const metadata: Metadata = { title: "Founding providers — PsychMind", robots: { index: false, follow: false } };

// Where the founding link lands (app/(auth)/founding/[code]/route.ts), with
// the outcome in ?s=. All copy is new: TODO(client).

type Outcome = { icon: ReactNode; tone: "neutral" | "success"; eyebrow?: string; title: string; description: string; actions: { href: string; label: string }[] };

export default async function FoundingPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const code = (await cookies()).get(FOUNDING_COOKIE)?.value;
  const loginBack = code ? `/login?next=${encodeURIComponent(`/founding/${code}`)}` : "/login";

  const outcomes: Record<string, Outcome> = {
    invite: {
      icon: <SparklesIcon className="size-5" />,
      tone: "neutral",
      eyebrow: "Founding providers",
      title: "Join PsychMind as a founding provider",
      description:
        "You're invited to be one of PsychMind's first providers. Your listing is free, for good. Create your provider account to start; our team verifies every profile before it appears in search.",
      actions: [
        { href: "/signup/provider", label: "Create your provider account" },
        { href: loginBack, label: "I already have a provider account" },
      ],
    },
    welcome: {
      icon: <CheckCircle2Icon className="size-5" />,
      tone: "success",
      eyebrow: "Founding providers",
      title: "You're a founding provider",
      description: "Your PsychMind listing is free, for good. Finish your profile, and our team will verify it before it appears in search.",
      actions: [{ href: "/provider", label: "Continue" }],
    },
    full: {
      icon: <UserRoundIcon className="size-5" />,
      tone: "neutral",
      title: "All founding spots are taken",
      description: "Every founding provider spot has been claimed. You can still join PsychMind as a provider.",
      actions: [{ href: "/signup/provider", label: "Sign up as a provider" }],
    },
    "providers-only": {
      icon: <UserRoundIcon className="size-5" />,
      tone: "neutral",
      title: "This link is for providers",
      description: "You're logged in with an account that isn't a provider account. Log out, then open the link again to join as a provider.",
      actions: [{ href: "/", label: "Go to PsychMind" }],
    },
  };
  const outcome = outcomes[s ?? ""] ?? {
    icon: <LinkIcon className="size-5" />,
    tone: "neutral",
    title: "This link isn't active",
    description: "Ask the PsychMind team for a new founding link, or sign up as a provider.",
    actions: [{ href: "/signup/provider", label: "Sign up as a provider" }],
  };

  return (
    <div className="flex flex-col gap-7">
      <span
        className={
          outcome.tone === "success"
            ? "flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
            : "flex size-11 items-center justify-center rounded-xl bg-warm-100 text-warm-700"
        }
      >
        {outcome.icon}
      </span>
      <AuthTitle eyebrow={outcome.eyebrow} title={outcome.title} description={outcome.description} />
      <div className="flex flex-col gap-3">
        {outcome.actions.map((a, i) => (
          <Button key={a.href} asChild fullWidth variant={i === 0 ? "primary" : "secondary"} className="h-10 text-[14px]">
            <Link href={a.href}>{a.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
