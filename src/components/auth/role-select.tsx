"use client";

import { cn } from "cn";
import { BadgeCheckIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { AuthHeading } from "./auth-shell";

const options = [
  {
    value: "patient",
    title: "I am looking for a provider",
    body: "Find and connect with a verified mental health professional.",
    Icon: UserRoundIcon,
  },
  {
    value: "provider",
    title: "I am a mental health provider",
    body: "Create a profile and connect with people who need your support.",
    Icon: BadgeCheckIcon,
  },
] as const;

// Figma A1 "Who are you joining as?" — radio cards, then step 2.
export function RoleSelect({ initial }: { initial?: "patient" | "provider" }) {
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "provider">(initial ?? "patient");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/signup/${role}`);
      }}
    >
      <FieldGroup>
        <AuthHeading
          step={{ current: 1, total: 2 }}
          title="Who are you joining as?"
          description="This helps us set up the right experience for you."
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium text-text-primary">Choose account type</legend>
          <div role="radiogroup" aria-label="Choose account type" className="flex flex-col gap-3">
            {options.map(({ value, title, body, Icon }) => {
              const on = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setRole(value)}
                  className={cn(
                    "flex items-start gap-3 rounded-field border bg-white p-4 text-left transition-[border-color,box-shadow] focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none",
                    on ? "border-brand-primary shadow-[0_0_0_1px_var(--color-brand-primary)]" : "border-warm-200 hover:border-warm-300",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warm-100 text-warm-700">
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-primary">{title}</span>
                    <span className="text-sm text-text-tertiary">{body}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <Button type="submit" variant="brand" fullWidth>
          Continue
        </Button>
        <FieldDescription className="text-center">
          Already have an account? <Link href="/login">Sign in</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
