import Link from "next/link";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { Button } from "@/components/ui/button";
import { DoodleMagnifier } from "@/components/ui/doodles";
import { CircleArrowIcon } from "@/components/ui/icons";

// A profile link that doesn't (or no longer) lead to a listed provider: the
// link may be mistyped, or the provider may have left or paused their listing.
// TODO(client): copy.
export default function ProviderNotFound() {
  return (
    <div className="flex flex-col items-center px-4 pt-10 pb-16 text-center sm:pt-16">
      <DoodleMagnifier aria-hidden className="size-36 animate-float text-warm-800 sm:size-44" />
      <h1 className="mt-6 type-h3 text-text-primary">We couldn&apos;t find this provider</h1>
      <p className="mt-3 max-w-[480px] type-body text-text-secondary">
        The link may be mistyped, or this provider may no longer be listed on PsychMind.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/providers">
          Browse providers
          <CircleArrowIcon />
        </Link>
      </Button>
      <CrisisStrip className="mt-12 max-w-[560px] text-left" />
    </div>
  );
}
