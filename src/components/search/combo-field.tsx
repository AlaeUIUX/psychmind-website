"use client";

import { Command as CommandPrimitive } from "cmdk";
import { cn } from "cn";
import { XCircleIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

// A search box with suggestions (shadcn Command / cmdk underneath): arrow keys
// move through the suggestions, Enter picks one, or searches what was typed
// when nothing is suggested.

export type Suggestion = { value: string; label: string; hint?: string; icon?: ReactNode };

export function ComboField({
  label,
  value,
  onValueChange,
  onSubmit,
  onPick,
  suggestions,
  heading,
  placeholder,
  icon,
  onClear,
  className,
}: {
  /** Accessible name (cmdk labels the input with it). */
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onPick: (s: Suggestion) => void;
  suggestions: Suggestion[];
  heading?: string;
  placeholder?: string;
  icon?: ReactNode;
  /** Shows a clear button while there's text. */
  onClear?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const showList = open && suggestions.length > 0;

  return (
    <CommandPrimitive shouldFilter={false} loop label={label} className={cn("relative w-full overflow-visible", className)}>
      <div className="flex h-10 items-center gap-2 rounded-field border border-warm-300 bg-warm-50 px-3 transition-[border-color,box-shadow,background-color] focus-within:border-warm-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-ring/12 hover:border-warm-400">
        {icon}
        <CommandPrimitive.Input
          value={value}
          onValueChange={(v) => {
            onValueChange(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !showList) {
              e.preventDefault();
              onSubmit();
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent type-small font-medium text-text-primary outline-none placeholder:font-normal placeholder:text-text-placeholder"
        />
        {onClear && value && (
          <button
            type="button"
            aria-label="Clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClear}
            className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors hover:text-text-primary"
          >
            <XCircleIcon className="size-4 fill-warm-800 text-white" />
          </button>
        )}
      </div>
      {showList && (
        <CommandList className="absolute top-[calc(100%+6px)] left-0 z-50 w-full min-w-[260px] animate-in rounded-field border border-warm-200 bg-white p-1 shadow-raised fade-in-0 zoom-in-95">
          <CommandGroup heading={heading}>
            {suggestions.map((s) => (
              <CommandItem
                key={s.value}
                value={s.value}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={() => {
                  onPick(s);
                  setOpen(false);
                }}
                className="gap-2 rounded-[calc(var(--radius-field)-4px)] px-2.5 py-2 type-small text-text-secondary data-[selected=true]:bg-warm-100 data-[selected=true]:text-text-primary"
              >
                {s.icon}
                <span className="truncate">{s.label}</span>
                {s.hint && <span className="ml-auto shrink-0 type-caption text-text-tertiary">{s.hint}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      )}
    </CommandPrimitive>
  );
}
