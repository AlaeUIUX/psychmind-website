import { cn } from "cn";
import type { ReactNode } from "react";

type SectionBadgeProps = {
  /** Path to the badge's icon (the round PsychMind glyph variants). */
  icon: string;
  children: ReactNode;
  /** `md` is the section eyebrow (32px on phones, 40px from `sm`); `sm` sits inside cards. */
  size?: "sm" | "md";
  className?: string;
};

const sizes = {
  sm: { root: "gap-1.5 py-1 pl-1 pr-2.5 text-xs", icon: "size-4" },
  md: {
    root: "gap-2 py-1 pl-1 pr-3.5 text-sm sm:gap-2.5 sm:py-1.5 sm:pl-1.5 sm:pr-4 sm:text-md",
    icon: "size-6 sm:size-7",
  },
} as const;

// The pill eyebrow above every section heading ("Discovery", "Reviews", …).
export function SectionBadge({ icon, children, size = "md", className }: SectionBadgeProps) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-pill border border-black/[0.08] bg-warm-25 font-medium shadow-control",
        s.root,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" className={s.icon} />
      <span className="bg-linear-to-r from-warm-700 to-warm-600 bg-clip-text text-transparent">
        {children}
      </span>
    </span>
  );
}
