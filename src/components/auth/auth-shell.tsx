import { cn } from "cn";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { BackButton } from "./back-button";

type AuthShellProps = {
  children: ReactNode;
  /** Mobile "Go back" button (Figma: on every mobile auth screen except "Set a new password"). */
  showBack?: boolean;
  /** Right-hand art on desktop. */
  image?: string;
  /** Figma shows the legal line under the card on every desktop auth screen. */
  legal?: boolean;
  className?: string;
};

// Figma auth shell (A1–A6): a centred card on warm grey, the form on the left
// and an illustration on the right from `md` up; on phones a logo row with
// "Go back" above a single card.
export function AuthShell({
  children,
  showBack = true,
  image = "/images/login/login-illustration.jpg",
  legal = true,
  className,
}: AuthShellProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-4 sm:p-6 md:p-10">
      <div className={cn("flex w-full max-w-sm flex-col gap-6 md:max-w-[896px]", className)}>
        <div className="flex items-center justify-between md:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/home/logo.svg" alt="" width={28} height={28} />
            <span className="font-display text-lg text-warm-900">PsychMind</span>
          </Link>
          {showBack && <BackButton />}
        </div>

        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">{children}</div>
            <div className="relative hidden bg-muted md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </CardContent>
        </Card>

        {legal && (
          <FieldDescription className="hidden px-6 text-center md:block">
            By clicking continue, you agree to our <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </FieldDescription>
        )}
        <p className="text-center type-caption text-text-placeholder md:hidden">
          © {new Date().getFullYear()} PsychMind. All rights reserved.
        </p>
      </div>
    </div>
  );
}

/** Eyebrow / title / subtitle block at the top of every auth form. */
export function AuthHeading({
  eyebrow,
  title,
  description,
  step,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Figma "Step 1 of 2" with the current number in dark ink. */
  step?: { current: number; total: number };
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {step && (
        <span className="text-sm text-text-placeholder">
          Step <span className="font-semibold text-text-primary">{step.current}</span> of {step.total}
        </span>
      )}
      {eyebrow && <span className="text-sm font-medium text-muted-foreground">{eyebrow}</span>}
      <h1 className="type-h4 text-text-primary">{title}</h1>
      {description && <p className="text-balance text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
