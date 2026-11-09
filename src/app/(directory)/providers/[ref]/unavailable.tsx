import Link from "next/link";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { Button } from "@/components/ui/button";
import { DoodleMagnifier } from "@/components/ui/doodles";
import { CtaArrowIcon } from "@/components/ui/hugeicons";
import { displayName } from "@/lib/provider/display";
import type { UnavailableProvider } from "@/server/directory/data";

// A profile link to a provider who was listed but isn't now (paused, unpaid,
// suspended, taking a break), from a saved list, a request or an old share.
// Same shape as not-found.tsx, but it says who and that it's for now; it
// never says why. TODO(client): copy.
export function ProviderUnavailable({ p, saved }: { p: UnavailableProvider; saved: boolean }) {
  const name = displayName(p);
  return (
    <div className="flex flex-col items-center px-4 pt-10 pb-16 text-center sm:pt-16">
      <DoodleMagnifier aria-hidden className="size-36 animate-float text-warm-800 sm:size-44" />
      <h1 className="mt-6 type-h3 text-text-primary">{name} is currently unavailable</h1>
      <p className="mt-3 max-w-[480px] type-body text-text-secondary">
        This provider isn&apos;t taking requests on PsychMind right now.
        {saved ? " They'll stay in your saved providers in case they come back." : " Their profile may be back later."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/providers">
            Browse providers
            <CtaArrowIcon />
          </Link>
        </Button>
        {saved && (
          <Button asChild size="lg" variant="secondary">
            <Link href="/account">Your saved providers</Link>
          </Button>
        )}
      </div>
      <CrisisStrip className="mt-12 max-w-[560px] text-left" />
    </div>
  );
}
