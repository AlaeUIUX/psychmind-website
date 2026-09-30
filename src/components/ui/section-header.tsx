import { cn } from "cn";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { SectionBadge } from "@/components/ui/section-badge";

type SectionHeaderProps = {
  badge?: { icon: string; label: string };
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "start" | "center";
  /** Rendered beside the heading from `sm` up (below it on phones). */
  action?: ReactNode;
  className?: string;
};

// Badge → H2 → subtitle, the opening of every content section. Its pieces
// cascade in one after another as the section scrolls into view.
export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "start",
  action,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  const text = (
    <Reveal
      stagger
      className={cn(
        "flex flex-col gap-4 sm:gap-5",
        centered ? "items-center text-center" : "items-start",
      )}
    >
      {badge && <SectionBadge icon={badge.icon}>{badge.label}</SectionBadge>}
      <h2 className={cn("type-h2 text-text-primary", centered ? "max-w-[768px]" : "max-w-[720px]")}>
        {title}
      </h2>
      {subtitle && <p className="type-lead max-w-[624px] text-text-tertiary">{subtitle}</p>}
    </Reveal>
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
      <Reveal delay={240} className="shrink-0">
        {action}
      </Reveal>
    </div>
  );
}
