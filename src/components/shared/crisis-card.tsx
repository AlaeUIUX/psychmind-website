import { Button } from "@/components/ui/button";
import { PhoneIcon } from "@/components/ui/icons";
import { ArrowRightIcon } from "@/components/ui/hugeicons";

// 988 Suicide & Crisis Lifeline card (US). Shown on Home and How it works so
// immediate help is always one tap away. Light, in the bento's greys (no dark
// card, no glow): warm-100 with a hairline, ink type, the ink and light buttons.
export function CrisisCard() {
  return (
    <aside aria-labelledby="crisis-title" className="rounded-card border border-warm-200 bg-warm-100 p-6 sm:p-8">
      <p className="text-[13px] font-medium text-warm-500">Need help right now?</p>
      <h3 id="crisis-title" className="mt-3 type-h4 text-text-primary">
        You don&apos;t have to wait for an appointment.
      </h3>
      <p className="mt-3 type-body text-text-tertiary">
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
