"use client";

import { cn } from "cn";
import { useState } from "react";
import { MapPinIcon, MonitorIcon } from "@/components/ui/icons";

export type SessionMode = "in-person" | "online";

const options: { value: SessionMode; label: string; Icon: typeof MonitorIcon }[] = [
  { value: "in-person", label: "In-person", Icon: MapPinIcon },
  { value: "online", label: "Online", Icon: MonitorIcon },
];

type Props = {
  size?: "sm" | "md";
  /** Controlled value; `null` shows neither chosen (search: either format). */
  value?: SessionMode | null;
  defaultValue?: SessionMode;
  onChange?: (mode: SessionMode) => void;
  /** Static picture of the control (used inside product previews). */
  decorative?: boolean;
  className?: string;
};

// In-person / Online, as a compact segmented switch: each option carries its
// own icon, and a white thumb slides under whichever is chosen.
export function SessionModeSwitch({ size = "md", value, defaultValue = "online", onChange, decorative, className }: Props) {
  const [own, setOwn] = useState<SessionMode>(defaultValue);
  const mode = value === undefined ? own : value;
  const index = options.findIndex((o) => o.value === mode);
  const sm = size === "sm";

  const pick = (next: SessionMode) => {
    setOwn(next);
    onChange?.(next);
  };

  return (
    <div
      role={decorative ? undefined : "radiogroup"}
      aria-label={decorative ? undefined : "Session format"}
      aria-hidden={decorative || undefined}
      className={cn(
        "relative grid w-fit shrink-0 grid-cols-2 rounded-pill bg-warm-100 ring-1 ring-warm-200 ring-inset",
        sm ? "p-0.5" : "p-1",
        className,
      )}
    >
      {/* sliding thumb */}
      <span
        aria-hidden
        className={cn(
          "absolute rounded-pill bg-white shadow-[0_1px_2px_rgb(28_25_23/0.08),0_4px_12px_-4px_rgb(28_25_23/0.18)] ring-1 ring-black/[0.04] transition-[transform,opacity] duration-500 ease-spring",
          sm ? "inset-y-0.5 left-0.5 w-[calc(50%-2px)]" : "inset-y-1 left-1 w-[calc(50%-4px)]",
          index < 0 && "opacity-0",
        )}
        style={{ transform: `translateX(${Math.max(index, 0) * 100}%)` }}
      />
      {options.map(({ value, label, Icon }) => {
        const active = value === mode;
        const content = (
          <>
            <Icon
              className={cn(
                "shrink-0 transition-colors duration-300",
                sm ? "size-3.5" : "size-[18px]",
                active ? "text-brand-primary" : "text-warm-600",
              )}
            />
            {label}
          </>
        );
        const cls = cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-pill font-medium whitespace-nowrap transition-colors duration-300",
          sm ? "h-7 px-2.5 text-xs" : "h-10 px-4 text-md",
          active ? "text-text-primary" : "text-text-placeholder hover:text-text-secondary",
        );
        return decorative ? (
          <span key={value} className={cls}>
            {content}
          </span>
        ) : (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => pick(value)}
            className={cls}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
