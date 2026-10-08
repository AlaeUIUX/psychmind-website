import { cn } from "cn";
import type { ReactNode } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

type FormRowProps = {
  id: string;
  label: ReactNode;
  /** Figma: red "*" after required labels, grey "Optional" on the right otherwise. */
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Label + control + helper + inline error, wired for screen readers:
 *  give the control `aria-describedby={describedBy(id, …)}` and `aria-invalid`. */
export function FormRow({ id, label, required, optional, hint, error, className, children }: FormRowProps) {
  return (
    <Field data-invalid={error ? true : undefined} className={cn("gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel htmlFor={id} className="text-text-primary">
          {label}
          {required && (
            <span aria-hidden className="text-destructive">
              *
            </span>
          )}
        </FieldLabel>
        {optional && <span className="type-small text-text-placeholder">Optional</span>}
      </div>
      {children}
      {hint && !error && <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

export function describedBy(id: string, { hint, error }: { hint?: unknown; error?: unknown }) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}
