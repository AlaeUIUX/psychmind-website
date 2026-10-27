import { cn } from "cn";
import type { ReactNode } from "react";

// Catalyst Design Lab's status pill (its TimePill), the one pill on the site:
// the hero's figures (components/home/trust-row.tsx) and every section
// eyebrow. 13px in a 32px white pill with a hairline (no shadow), the lead in
// a 24px warm-grey chip, corners concentric (8px chip + 4px inset = 12px).
export const statusPill = "h-8 rounded-[12px] border border-warm-200 bg-white text-[13px] whitespace-nowrap text-warm-700";
export const statusChip = "flex h-6 items-center gap-1 rounded-[8px] bg-warm-100 px-2 font-medium tabular-nums text-warm-950";

type SectionBadgeProps = {
  /** Path to the badge's icon (the round PsychMind glyph variants). */
  icon: string;
  children: ReactNode;
  className?: string;
};

/** The pill eyebrow above a section heading ("Discovery", "Reviews", …): the
 *  section's glyph in the chip, then its name. */
export function SectionBadge({ icon, children, className }: SectionBadgeProps) {
  return (
    <span className={cn(statusPill, "inline-flex w-fit shrink-0 items-center gap-2 pr-3 pl-1", className)}>
      <span className={statusChip}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" className="size-3.5" />
      </span>
      <span>{children}</span>
    </span>
  );
}
