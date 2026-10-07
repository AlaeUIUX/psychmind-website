import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";

// The one banner for account-level status: verification pending, payment
// failed ("paused in 3 days"), hidden from search, live again… Sits at the
// top of every dashboard page while the state lasts. Tone sets the colour and
// icon; `countdown` adds an emphasised deadline; `action` is usually a Button.
const bannerVariants = cva(
  "flex w-full flex-col gap-3 rounded-field border px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5",
  {
    variants: {
      tone: {
        info: "border-sky-200 bg-sky-50 text-sky-900",
        success: "border-emerald-200 bg-emerald-50 text-emerald-900",
        warning: "border-amber-200 bg-amber-50 text-amber-950",
        danger: "border-red-200 bg-red-50 text-red-900",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const icons = {
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: CircleAlertIcon,
};

type StatusBannerProps = VariantProps<typeof bannerVariants> & {
  title: ReactNode;
  children?: ReactNode;
  /** e.g. "3 days left" — shown as an emphasised pill before the title. */
  countdown?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function StatusBanner({ tone = "info", title, children, countdown, action, className }: StatusBannerProps) {
  const Icon = icons[tone ?? "info"];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(bannerVariants({ tone }), className)}
    >
      <div className="flex flex-1 items-start gap-3">
        <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <p className="flex flex-wrap items-center gap-2 type-small font-semibold">
            {countdown && (
              <span className="rounded-pill bg-current/10 px-2 py-0.5 text-xs font-semibold tabular-nums">
                {countdown}
              </span>
            )}
            {title}
          </p>
          {children && <div className="type-small opacity-85">{children}</div>}
        </div>
      </div>
      {action && <div className="flex shrink-0 gap-2 pl-8 sm:pl-0">{action}</div>}
    </div>
  );
}
