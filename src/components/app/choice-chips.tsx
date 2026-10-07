"use client";

import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Option = { value: string; label: string };

type ChoiceChipsProps = {
  options: Option[];
  value: string[];
  onValueChange: (value: string[]) => void;
  /** Accessible name for the group (the visible label's text). */
  label: string;
  /** Cap the number of picks (e.g. "choose up to 5"). */
  max?: number;
  className?: string;
};

// Multi-select chips for specialties, approaches, languages, age groups…
// Figma: outlined when off, filled ink when on. Built on shadcn ToggleGroup,
// so arrow keys move between chips and Space toggles.
export function ChoiceChips({ options, value, onValueChange, label, max, className }: ChoiceChipsProps) {
  const full = max !== undefined && value.length >= max;
  return (
    <ToggleGroup
      type="multiple"
      variant="chip"
      size="chip"
      spacing={2}
      aria-label={label}
      value={value}
      onValueChange={onValueChange}
      className={cn("flex-wrap", className)}
    >
      {options.map((option) => {
        const on = value.includes(option.value);
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            disabled={full && !on}
            className="data-[state=on]:pl-2.5"
          >
            {on && <CheckIcon aria-hidden className="size-3.5" />}
            {option.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
