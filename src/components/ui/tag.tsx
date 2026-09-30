import { cn } from "cn";
import type { ReactNode } from "react";

/** Small bordered chip (specialties, session types, locations). */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-tag border border-warm-300 bg-white px-2.5 py-1 text-sm font-medium text-text-secondary shadow-control",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** "Verified" chip shown next to a provider's name. */
export function VerifiedBadge({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Tag className={cn("shrink-0", size === "sm" && "px-2 py-0.5 text-xs")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/how-it-works/verified-check-icon.svg"
        alt=""
        className={size === "sm" ? "size-3" : "size-3.5"}
      />
      Verified
    </Tag>
  );
}
