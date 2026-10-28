import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CtaArrowIcon } from "@/components/ui/hugeicons";
import { Container, Section } from "@/components/ui/section";
import { LighthouseIsland } from "./lighthouse-island";

// The other side of the marketplace: a slim band inviting providers in (the
// provider onboarding + dashboard live in the Figma file), in the bento's
// greys: warm-100 with a hairline, ink type, the ink and light buttons. The
// question, a line and the two buttons on the left; on the right, the girl on a
// little island under a turning lighthouse, in 3D (lighthouse-island.tsx).
// Draft copy — TODO(client): approve wording and the sign-up destination.

/** `voyageEnd`: the boat sails down to it (home/voyage.tsx), as on How it works. */
export function ProviderBand({ voyageEnd = false }: { voyageEnd?: boolean } = {}) {
  return (
    <Section spacing="sm">
      <Container>
        <div
          data-voyage-end={voyageEnd || undefined}
          className="grid items-center gap-8 overflow-hidden rounded-card border border-warm-200 bg-warm-100 px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-2 lg:px-14">
          <div className="flex max-w-[560px] flex-col gap-3">
            <p className="text-[13px] font-medium text-warm-500">
              For providers
            </p>
            <h2 className="type-h2 text-text-primary">Are you a provider?</h2>
            <p className="type-hero-sub">
              Build a verified profile, show how you practice, and get found by
              the people looking for exactly what you offer.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="/signup?role=provider">
                  Join as a provider
                  <CtaArrowIcon />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/how-it-works/providers">How it works</Link>
              </Button>
            </div>
          </div>
          <LighthouseIsland className="mx-auto w-full max-w-[460px]" />
        </div>
      </Container>
    </Section>
  );
}
