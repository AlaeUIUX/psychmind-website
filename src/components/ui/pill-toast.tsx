"use client";

import { cn } from "cn";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { statusChip, statusPill } from "@/components/ui/section-badge";

// A toast in the landing page's status pill (section-badge.tsx; the privacy
// globe's "We never know what she's carrying around." line): a white pill
// with a hairline, the icon in a warm-grey chip, one line of text, and an
// optional action after a hairline divider. Floating over the page, it adds
// the raised shadow the inline pills don't need.

type PillToastOptions = {
  icon: ReactNode;
  /** "error" tints the icon red; the text stays ink. */
  tone?: "neutral" | "error";
  action?: { label: string; onClick: () => void };
  duration?: number;
};

export function pillToast(message: ReactNode, { icon, tone = "neutral", action, duration }: PillToastOptions) {
  return toast.custom(
    (id) => (
      <div
        role={tone === "error" ? "alert" : "status"}
        className={cn(statusPill, "flex max-w-full items-center gap-2 py-0 pl-1 shadow-raised", action ? "pr-1" : "pr-3")}
      >
        <span className={cn(statusChip, "shrink-0", tone === "error" && "text-red-600")}>{icon}</span>
        <span className="min-w-0 truncate">{message}</span>
        {action && (
          <>
            <span aria-hidden className="h-4 w-px shrink-0 bg-warm-200" />
            <button
              type="button"
              onClick={() => {
                action.onClick();
                toast.dismiss(id);
              }}
              className="h-6 shrink-0 rounded-[8px] px-2 font-medium text-warm-950 transition-colors hover:bg-warm-100 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              {action.label}
            </button>
          </>
        )}
      </div>
    ),
    // Unstyled toasts shrink to their content: stretch the slot and centre
    // the pill in it (the toaster sits bottom-centre).
    { duration, unstyled: true, className: "flex w-full justify-center" },
  );
}
