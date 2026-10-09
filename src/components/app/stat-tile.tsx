import { cn } from "cn";
import { ArrowDownRightIcon, ArrowUpRightIcon, InfoIcon, MinusIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type StatTileProps = {
  label: string;
  value: ReactNode;
  /** Change vs the previous period. Its sign picks the pill: green up, red down, gray none. */
  delta?: number;
  /** How the change reads, e.g. "+250" or "+2.5%" (Figma D1). Defaults to the signed number. */
  deltaLabel?: string;
  /** What the change is measured against, e.g. "vs previous 7 days". */
  hint?: string;
  /** A one-line definition, behind an info icon. */
  info?: string;
  /** The page's lead number, set larger. Use once per page. */
  hero?: boolean;
  className?: string;
};

// One analytics number (Figma D1 Overview): label, value and a change pill.
export function StatTile({ label, value, delta, deltaLabel, hint, info, hero, className }: StatTileProps) {
  const id = useId();
  const tone = delta === undefined ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const Icon = tone === "up" ? ArrowUpRightIcon : tone === "down" ? ArrowDownRightIcon : MinusIcon;
  return (
    <div role="group" aria-labelledby={id} className={cn("flex flex-col gap-2 rounded-[calc(var(--radius-card)-4px)] border border-warm-200 bg-white p-4 sm:p-5", className)}>
      <p className="flex items-center gap-1.5 type-ui-label text-text-tertiary">
        <span id={id}>{label}</span>
        {info && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`About ${label.toLowerCase()}`} className="-m-1 rounded-full p-1 text-text-placeholder transition-colors hover:text-text-primary">
                <InfoIcon aria-hidden className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-60">{info}</TooltipContent>
          </Tooltip>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p data-slot="stat-value" className={cn("text-text-primary", hero ? "type-ui-hero-figure" : "type-ui-figure")}>
          {value}
        </p>
        {tone && (
          <Badge variant={tone === "up" ? "success" : tone === "down" ? "danger" : "neutral"} className="gap-0.5 px-2 tabular-nums">
            <Icon aria-hidden />
            <span className="sr-only">{tone === "up" ? "Up" : tone === "down" ? "Down" : "No change"}</span>
            {deltaLabel ?? (delta! > 0 ? `+${delta}` : String(delta))}
          </Badge>
        )}
      </div>
      {hint && <p className="type-ui-caption text-text-placeholder">{hint}</p>}
    </div>
  );
}
