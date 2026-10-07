import { cn } from "cn";

type StepProgressProps = {
  /** 1-based. */
  current: number;
  total: number;
  /** Name of the current step, read out with the count. */
  label?: string;
  className?: string;
};

// Figma's wizard indicator ("Step 1 of 5", the number in darker ink), plus a
// thin segmented track so progress is visible at a glance.
export function StepProgress({ current, total, label, className }: StepProgressProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <p className="type-small text-text-placeholder" aria-live="polite">
        Step <span className="font-semibold text-text-primary">{current}</span> of {total}
        {label && <span className="sr-only">: {label}</span>}
      </p>
      <div aria-hidden className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-pill transition-colors duration-500 ease-out-soft",
              i < current ? "bg-warm-800" : "bg-warm-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}
