import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, PhoneIcon } from "@/components/ui/icons";

// 988 Suicide & Crisis Lifeline card (US). Shown on Home and How it works so
// immediate help is always one tap away.
export function CrisisCard() {
  return (
    <aside
      aria-labelledby="crisis-title"
      className="grain relative overflow-hidden rounded-card bg-warm-950 p-6 text-warm-25 shadow-card sm:p-8"
    >
      <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-brand-primary/25 blur-[70px]" />
      <p className="relative type-small font-medium tracking-[0.08em] text-warm-300 uppercase">Need help right now?</p>
      <h3 id="crisis-title" className="relative mt-3 type-h4 text-warm-25">
        You don&apos;t have to wait for an appointment.
      </h3>
      <p className="relative mt-3 type-body text-warm-300">
        Call or text <span className="font-semibold text-white">988</span>{" "}to reach the Suicide &amp; Crisis
        Lifeline — free, confidential and available 24/7. In an emergency, call{" "}
        <span className="font-semibold text-white">911</span>.
      </p>
      <div className="relative mt-6 flex flex-wrap gap-2">
        <Button asChild variant="inverse" size="md">
          <a href="tel:988">
            <PhoneIcon />
            Call 988
          </a>
        </Button>
        <Button asChild variant="outline-light" size="md">
          <a href="sms:988">Text 988</a>
        </Button>
      </div>
      <a
        href="https://988lifeline.org/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="relative mt-4 inline-flex items-center gap-1 type-small text-warm-300 underline-offset-4 transition-colors hover:text-white hover:underline"
      >
        Or chat online at 988lifeline.org
        <ArrowUpRightIcon className="size-3.5" />
      </a>
    </aside>
  );
}
