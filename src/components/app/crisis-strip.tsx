import { cn } from "cn";
import { PhoneIcon } from "@/components/ui/hugeicons";

// Compact 988 line for app screens (search, profile, request form, errors).
// The full CrisisCard stays on marketing pages; this one is always one tap
// from help without taking over the page. Copy is the approved resource-center
// line ("In crisis? Don't wait…").
// `quiet`: grey on grey (ink at an opacity), for the auth shell's footer, where
// it sits under every log-in, sign-up and request step without pulling focus.
export function CrisisStrip({ className, tone = "ink" }: { className?: string; tone?: "ink" | "quiet" }) {
  const quiet = tone === "quiet";
  return (
    <aside
      aria-label="Crisis support"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-field px-4 py-3 type-small",
        quiet ? "bg-warm-900/[0.04] text-warm-900/60" : "bg-warm-950 text-warm-300",
        className,
      )}
    >
      <span className="text-pretty">
        <span className={cn("font-medium", quiet ? "text-warm-900" : "text-white")}>In crisis? Don&apos;t wait.</span> Call or text 988 any time, day or
        night. In an emergency, call 911.
      </span>
      <a
        href="tel:988"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1 font-medium text-warm-900 transition-colors",
          quiet ? "ring-1 ring-warm-900/10 hover:bg-warm-50" : "hover:bg-warm-100",
        )}
      >
        <PhoneIcon aria-hidden className="size-3.5" />
        Call 988
      </a>
    </aside>
  );
}
