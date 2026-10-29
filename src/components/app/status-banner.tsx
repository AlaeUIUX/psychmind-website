import { cn } from "cn";
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "@/components/ui/hugeicons";
import type { ReactNode } from "react";

// The one notice for account-level status: verification pending, payment
// failed ("paused in 3 days"), hidden from search, live again… In dashboards
// it sits under the page header while the state lasts. A neutral white card
// (no coloured band): the tone only colours the icon in its tile and the
// countdown pill. `action` is usually a Button.

type Tone = "info" | "success" | "warning" | "danger";

const icons = {
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: CircleAlertIcon,
};

const iconTone: Record<Tone, string> = {
  info: "text-warm-900/60",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
};

const countdownTone: Record<Tone, string> = {
  info: "bg-warm-900/[0.05] text-warm-900/70",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-800",
};

type StatusBannerProps = {
  tone?: Tone;
  title: ReactNode;
  children?: ReactNode;
  /** e.g. "3 days left" — shown as an emphasised pill before the title. */
  countdown?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function StatusBanner({ tone = "info", title, children, countdown, action, className }: StatusBannerProps) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "flex w-full flex-col gap-3 rounded-[13px] border border-warm-900/10 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgb(28_25_23/0.04)] sm:flex-row sm:items-center sm:gap-4",
        className,
      )}
    >
      <div className="flex flex-1 items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-warm-900/10 bg-warm-900/[0.02]">
          <Icon aria-hidden className={cn("size-4", iconTone[tone])} />
        </span>
        <div className="flex flex-col gap-0.5 pt-0.5">
          <p className="flex flex-wrap items-center gap-2 text-sm leading-5 font-medium text-warm-900">
            {countdown && <span className={cn("rounded-pill px-2 py-0.5 text-xs font-medium tabular-nums", countdownTone[tone])}>{countdown}</span>}
            {title}
          </p>
          {children && <div className="text-[13px] leading-5 text-warm-900/60">{children}</div>}
        </div>
      </div>
      {action && <div className="flex shrink-0 gap-2 pl-11 sm:pl-0">{action}</div>}
    </div>
  );
}
