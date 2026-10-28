import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { PhoneIcon } from "@/components/ui/icons";
import { ArrowRightIcon } from "@/components/ui/hugeicons";

// 988 Suicide & Crisis Lifeline card (US). Shown on Home and How it works so
// immediate help is always one tap away. Light, in the bento's greys (no dark
// card, no glow): warm-100 with a hairline, ink type, the ink and light buttons.
// `inline`: just its help, for a row of the FAQ (How it works), where the row's
// question ("What if I need help right now?") stands in for its eyebrow and heading.
export function CrisisCard({ inline = false }: { inline?: boolean } = {}) {
  return (
    <aside
      aria-labelledby={inline ? undefined : "crisis-title"}
      aria-label={inline ? "Crisis support" : undefined}
      className={inline ? "pb-6" : "rounded-card border border-warm-200 bg-warm-100 p-6 sm:p-8"}
    >
      {!inline && (
        <>
          <p className="text-[13px] font-medium text-warm-500">Need help right now?</p>
          <h3 id="crisis-title" className="mt-3 type-h4 text-text-primary">
            You don&apos;t have to wait for an appointment.
          </h3>
        </>
      )}
      <p className={cn("type-body text-text-tertiary", inline ? "max-w-[640px] pr-14" : "mt-3")}>
        Call or text <span className="font-medium text-text-primary">988</span>{" "}to reach the Suicide &amp; Crisis
        Lifeline: free, confidential and available 24/7. In an emergency, call{" "}
        <span className="font-medium text-text-primary">911</span>.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild size="md">
          <a href="tel:988">
            <PhoneIcon />
            Call 988
          </a>
        </Button>
        <Button asChild variant="secondary" size="md">
          <a href="sms:988">Text 988</a>
        </Button>
      </div>
      <a
        href="https://988lifeline.org/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1 type-small text-warm-600 underline-offset-4 transition-colors hover:text-warm-900 hover:underline"
      >
        Or chat online at 988lifeline.org
        <ArrowRightIcon className="size-3.5" />
      </a>
    </aside>
  );
}
