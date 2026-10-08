"use client";

import { cn } from "cn";
import { EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordStrength, suggestEmail } from "@/lib/auth/email-typos";

// Auth form parts in the portal style: 13px labels, 40px fields, quiet
// helpers, errors that explain how to fix things.

export function AuthTitle({ eyebrow, title, description }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow && <p className="type-ui-label text-warm-500">{eyebrow}</p>}
      <h1 className="type-ui-headline text-warm-900">{title}</h1>
      {description && <p className="type-ui-body text-warm-600">{description}</p>}
    </div>
  );
}

type FieldProps = {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AuthField({ id, label, error, hint, optional, aside, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} data-invalid={error ? true : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="type-ui-label text-warm-800">
          {label}
        </Label>
        {optional ? <span className="type-ui-caption text-warm-400">Optional</span> : aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="type-ui-caption text-red-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="type-ui-caption text-warm-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const fieldClass = "h-10 shadow-none";

export function TextInput({ id, error, className, ...props }: React.ComponentProps<"input"> & { id: string; error?: string }) {
  return (
    <Input
      id={id}
      name={props.name ?? id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(fieldClass, className)}
      {...props}
    />
  );
}

/** Email with an inline "Did you mean …?" fix for common domain typos. */
export function EmailInput({
  id = "email",
  error,
  defaultValue,
  onValue,
  autoFocus,
}: {
  id?: string;
  error?: string;
  defaultValue?: string;
  onValue?: (v: string) => void;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [checked, setChecked] = useState(false);
  const suggestion = checked ? suggestEmail(value) : null;
  return (
    <>
      <TextInput
        id={id}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          setValue(e.target.value);
          setChecked(false);
          onValue?.(e.target.value);
        }}
        onBlur={() => setChecked(true)}
        error={error}
        required
      />
      {suggestion && (
        <p className="type-ui-caption text-warm-600">
          Did you mean{" "}
          <button
            type="button"
            className="font-medium text-warm-900 underline underline-offset-2"
            onClick={() => {
              setValue(suggestion);
              onValue?.(suggestion);
              setChecked(false);
            }}
          >
            {suggestion}
          </button>
          ?
        </p>
      )}
    </>
  );
}

/** Password with show/hide, a caps-lock warning and (optionally) a strength meter. */
export function PasswordInput({
  id = "password",
  error,
  meter,
  autoComplete = "current-password",
  placeholder,
}: {
  id?: string;
  error?: string;
  meter?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [value, setValue] = useState("");
  const strength = passwordStrength(value);
  return (
    <>
      <div className="relative">
        <TextInput
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="pr-10"
          error={error}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}
          onBlur={() => setCaps(false)}
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-800"
        >
          {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>
      {caps && <p className="type-ui-caption text-amber-700">Caps Lock is on.</p>}
      {meter && value && (
        <div className="flex items-center gap-2" aria-live="polite">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  n <= strength.score
                    ? strength.score <= 1
                      ? "bg-red-500"
                      : strength.score === 2
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    : "bg-warm-200",
                )}
              />
            ))}
          </div>
          <span className="w-16 text-right type-ui-caption text-warm-600">{strength.label}</span>
        </div>
      )}
    </>
  );
}

export function SubmitButton({ children, pendingLabel }: { children: ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="default" fullWidth disabled={pending} aria-busy={pending || undefined} className="h-10 text-[14px]">
      {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}

export function FormAlert({ message, tone = "error" }: { message?: string; tone?: "error" | "success" | "info" }) {
  if (!message) return null;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-3.5 py-2.5 type-ui-small",
        tone === "error" && "bg-red-50 text-red-900 ring-1 ring-red-200 ring-inset",
        tone === "success" && "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 ring-inset",
        tone === "info" && "bg-warm-50 text-warm-800 ring-1 ring-warm-200 ring-inset",
      )}
    >
      {message}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 type-ui-caption text-warm-400" aria-hidden>
      <span className="h-px flex-1 bg-warm-200" />
      or
      <span className="h-px flex-1 bg-warm-200" />
    </div>
  );
}
