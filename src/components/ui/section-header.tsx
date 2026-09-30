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

// Badge → H2 → subtitle, the opening of every content section. The badge
// fades up, the title rises line by line from behind a mask, then the
// subtitle follows.
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
    <div className={cn("flex flex-col gap-4 sm:gap-5", centered ? "items-center text-center" : "items-start")}>
      {badge && (
        <Reveal>
          <SectionBadge icon={badge.icon}>{badge.label}</SectionBadge>
        </Reveal>
      )}
      <SplitHeading
        delay={0.1}
        className={cn(
          "type-h2",
          inverted ? "text-warm-25" : "text-text-primary",
          centered ? "max-w-[768px]" : "max-w-[720px]",
        )}
      >
        {title}
      </SplitHeading>
      {subtitle && (
        <Reveal delay={260}>
          <p className={cn("type-lead max-w-[624px]", inverted ? "text-warm-300" : "text-text-tertiary")}>
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
