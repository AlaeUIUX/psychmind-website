"use client";

import { cn } from "cn";
import { BadgeCheckIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { useAuthPanel } from "./auth-context";
import { AuthTitle, HoverArrow } from "./fields";

const options = [
  {
    value: "patient",
    title: "I am looking for a provider",
    body: "Find and connect with a verified mental health professional.",
    Icon: SearchIcon,
  },
  {
    value: "provider",
    title: "I am a mental health provider",
    body: "Create a profile and connect with people who need your support.",
    Icon: BadgeCheckIcon,
  },
] as const;

// Figma A1 "Who are you joining as?" as shadcn-style choice cards: the icon
// tile stays neutral, a radio circle on the right fills with a blue dot, and
// the chosen card gets a blue border and tint. Nothing is preselected, so
// Continue waits for a choice. The portal panel previews the chosen side.
export function RoleSelect({ initial }: { initial?: "patient" | "provider" }) {
  const router = useRouter();
  const { role, setRole } = useAuthPanel();

  useEffect(() => {
    setRole(initial ?? null);
  }, [initial, setRole]);

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (role) router.push(`/signup/${role}`);
      }}
    >
      <AuthTitle eyebrow="Step 1 of 2" title="Who are you joining as?" description="This helps us set up the right experience for you." />
      <RadioGroupPrimitive.Root
        value={role ?? ""}
        onValueChange={(v) => setRole(v as "patient" | "provider")}
        aria-label="Choose account type"
        className="flex flex-col gap-3"
      >
        {options.map(({ value, title, body, Icon }, i) => (
          <RadioGroupPrimitive.Item
            key={value}
            value={value}
            style={{ "--i": i + 1 } as React.CSSProperties}
            className={cn(
              "group flex animate-ui-enter items-start gap-3.5 rounded-xl border bg-white p-4 text-left outline-none",
              "transition-[border-color,box-shadow,background-color] duration-200",
              "focus-visible:ring-4 focus-visible:ring-ring/15",
              "data-[state=unchecked]:border-warm-200 data-[state=unchecked]:hover:border-warm-300 data-[state=unchecked]:hover:bg-warm-50/60",
              "data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50/50 data-[state=checked]:shadow-[0_0_0_1px_var(--color-blue-600)]",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-warm-50 text-warm-700">
              <Icon className="size-4" />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="type-ui-heading text-warm-900">{title}</span>
              <span className="type-ui-small text-warm-600">{body}</span>
            </span>
            {/* shadcn RadioGroupItem look: a circle that gains a dot. */}
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-warm-300 bg-white shadow-xs transition-colors group-data-[state=checked]:border-blue-600">
              <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-blue-600 data-[state=checked]:animate-in data-[state=checked]:zoom-in-50" />
            </span>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
      <Button type="submit" fullWidth disabled={!role} className="h-10 text-[14px]">
        Continue
        <HoverArrow />
      </Button>
    </form>
  );
}
