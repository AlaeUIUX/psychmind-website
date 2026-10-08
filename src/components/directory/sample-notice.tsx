import { cn } from "cn";
import { FlaskConicalIcon } from "lucide-react";

// Sample providers are shown on the live site until real providers join, so
// they're always labelled. TODO(client): copy.
export function SampleNotice({ single, className }: { single?: boolean; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 rounded-field border border-sky-200 bg-sky-50 px-4 py-3 type-small text-sky-900",
        className,
      )}
    >
      <FlaskConicalIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-sky-700" />
      <span>
        <span className="font-medium">{single ? "This is a sample profile." : "These are sample profiles."}</span>{" "}
        {single
          ? "It shows how a provider's page looks on PsychMind. Sample providers can't be booked."
          : "They show how PsychMind works while verified providers join. Sample providers can't be booked."}
      </span>
    </p>
  );
}
