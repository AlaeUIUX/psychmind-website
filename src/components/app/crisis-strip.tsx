import { cn } from "cn";
import { PhoneIcon } from "lucide-react";

// Compact 988 line for app screens (search, profile, request form, errors).
// The full CrisisCard stays on marketing pages; this one is always one tap
// from help without taking over the page. Copy is the approved resource-center
// line ("In crisis? Don't wait…").
export function CrisisStrip({ className }: { className?: string }) {
  return (
    <aside
      aria-label="Crisis support"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-field bg-warm-950 px-4 py-3 type-small text-warm-300",
        className,
      )}
    >
      <span>
        <span className="font-semibold text-white">In crisis? Don&apos;t wait.</span> Call or text 988 any time, day or
        night. In an emergency, call 911.
      </span>
      <a
        href="tel:988"
        className="inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1 font-medium text-warm-900 transition-colors hover:bg-warm-100"
      >
        <PhoneIcon aria-hidden className="size-3.5" />
        Call 988
      </a>
    </aside>
  );
}
