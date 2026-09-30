import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";

export function Hero() {
  return (
    <PageHero
      className="pb-16 sm:pb-24"
      illustration={{ src: "/images/how-it-works/hero-illustration.png" }}
      title="Finding the right provider should feel simple"
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
