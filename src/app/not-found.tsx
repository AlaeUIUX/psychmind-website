import type { Metadata } from "next";
import Link from "next/link";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DoodleMagnifier } from "@/components/ui/doodles";
import { CircleArrowIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Page not found — PsychMind" };

// Any URL that doesn't exist. Same chrome as the marketing site, a way back
// to search, and 988 for anyone who landed here in a hard moment.
// TODO(client): copy.
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-4 pt-10 pb-16 text-center sm:pt-16">
        <DoodleMagnifier aria-hidden className="size-40 animate-float text-warm-800 sm:size-48" />
        <p className="mt-4 type-overline text-text-placeholder">404</p>
        <h1 className="mt-3 type-display text-text-primary">We couldn&apos;t find that page</h1>
        <p className="mt-4 max-w-[480px] type-lead text-text-secondary">
          The link may be old, or the page may have moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              Back to home
              <CircleArrowIcon />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
        <CrisisStrip className="mt-12 max-w-[560px] text-left" />
      </main>
      <SiteFooter />
    </>
  );
}
