import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";

export function Hero() {
  return (
    <PageHero
      className="pb-16 sm:pb-24"
      illustration={{ src: "/images/how-it-works/hero-illustration.png" }}
      title={
        <>
          Finding the right provider should feel{" "}
          <span className="relative inline-block italic">
            simple
            {/* pencil underline, drawn in once the headline has landed */}
            <svg
              aria-hidden
              viewBox="0 0 240 16"
              preserveAspectRatio="none"
              className="absolute -bottom-1 left-0 h-3 w-full text-brand-primary sm:-bottom-2 sm:h-4"
            >
              <path
                d="M3 11C45 5 92 4 138 6C170 7 204 9 237 5"
                pathLength={1}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="draw-on-load"
              />
            </svg>
          </span>
        </>
      }
      subtitle="No referrals. No waitlists. Just a clear, guided path to the professional who is right for you."
    >
      <Button asChild variant="brand" size="lg">
        <Link href="/providers">
          Start your search
          <CircleArrowIcon />
        </Link>
      </Button>
      <p className="type-small text-text-tertiary sm:type-body">Takes less than 2 minutes. Free to browse.</p>
    </PageHero>
  );
}
