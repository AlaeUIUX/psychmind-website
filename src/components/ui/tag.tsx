import { cn } from "cn";
import type { ReactNode } from "react";
import { pill, topicChipIdle } from "@/components/home/search-styles";

/** Small bordered chip (specialties, session types, locations): the search
 *  bar's pill, so there's one chip shape everywhere. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn(pill, topicChipIdle, className)}>{children}</span>;
}

/** "Verified" chip shown next to a provider's name. */
export function VerifiedBadge({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Tag className={cn("shrink-0", size === "sm" && "h-6 px-2 text-xs")}>
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
