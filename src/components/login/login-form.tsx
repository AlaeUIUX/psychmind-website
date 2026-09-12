"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex items-center justify-between md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/images/home/logo.svg" alt="PsychMind" width={28} height={28} />
          <span className="font-display text-warm-900 text-lg">PsychMind</span>
        </Link>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-pill border border-warm-200 px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-warm-100 transition-colors"
        >
          <img src="/images/how-it-works/back-arrow-icon.svg" alt="" width={12} height={12} />
          Go back
        </button>
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="p-6 md:p-8"
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Welcome back
                </span>
                <h1 className="font-display text-display-xs text-warm-900">
                  Log in to PsychMind
                </h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Good to see you again. Pick up right where you left off.
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </Field>
              <Field>
                <Button type="submit">Continue</Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <Button variant="outline" type="button" className="w-full">
                  <img src="/images/login/google-icon.svg" alt="" width={16} height={16} />
                  Continue with Google
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <Link href="/signup">Create account</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/images/login/login-illustration.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
