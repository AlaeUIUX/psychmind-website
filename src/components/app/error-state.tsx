"use client";

import { cn } from "cn";
import { RotateCwIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: ReactNode;
  children?: ReactNode;
  /** Shows a "Try again" button that calls this (e.g. an error boundary's `reset`). */
  onRetry?: () => void;
  className?: string;
};

// A panel-sized failure: results couldn't load, a chart failed… Calm wording,
// no technical detail, and a retry when one makes sense.
// TODO(client): default copy.
export function ErrorState({
  title = "Something went wrong",
  children = "We couldn't load this right now. Please try again in a moment.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-3 rounded-card border border-warm-200 bg-white px-6 py-12 text-center", className)}
    >
      <h3 className="type-title text-text-primary">{title}</h3>
      <p className="max-w-[420px] type-body text-text-tertiary">{children}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          <RotateCwIcon />
          Try again
        </Button>
      )}
    </div>
  );
}
