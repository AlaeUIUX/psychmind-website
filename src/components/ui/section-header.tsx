import { cn } from "cn";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { SectionBadge } from "@/components/ui/section-badge";

type SectionHeaderProps = {
  badge?: { icon: string; label: string };
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "start" | "center";
  /** Rendered beside the heading from `sm` up (below it on phones). */
  action?: ReactNode;
  /** Light text for dark sections. */
  inverted?: boolean;
  className?: string;
};

// Badge → H2 → subtitle, the opening of every content section, in the home
// hero's language a step down (as the bento's "Discovery" first did): the
// status pill, the serif at 34px to the hero's 40, and the hero's grey Inter
// line under it. The badge fades up, the title rises line by line from behind
// a mask, then the subtitle follows.
export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "start",
  action,
  inverted = false,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  const text = (
    <div className={cn("flex flex-col gap-4", centered ? "items-center text-center" : "items-start")}>
      {badge && (
        <Reveal>
          <SectionBadge icon={badge.icon}>{badge.label}</SectionBadge>
        </Reveal>
      )}
      <SplitHeading
        delay={0.1}
        className={cn(inverted ? "type-h2 text-warm-25" : "type-hero-h2", centered ? "max-w-[640px]" : "max-w-[720px]")}
      >
        {title}
      </SplitHeading>
      {subtitle && (
        <Reveal delay={260}>
          <p
            className={cn(
              inverted ? "type-sub text-warm-300" : "type-hero-sub",
              centered ? "max-w-[480px] text-balance" : "max-w-[560px]",
            )}
          >
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );

  if (!action) return <div className={className}>{text}</div>;

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      {text}
      <Reveal delay={320} className="shrink-0">
        {action}
      </Reveal>
    </div>
  );
}
