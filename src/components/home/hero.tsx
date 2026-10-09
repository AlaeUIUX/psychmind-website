import { Reveal } from "@/components/reveal";
import { PageHero } from "@/components/ui/page-hero";
import { GUTTER } from "@/components/ui/section";
import { HeroSearch } from "./hero-search";
import { TrustRow } from "./trust-row";

export function Hero() {
  return (
    <div className="w-full">
      <PageHero
        className="pb-0 sm:pb-0"
        illustration={{ src: "/images/home/hero-top-illustration.png" }}
        title={
          <>
            {/* Mobile design (node 276:774) uses different copy from desktop (node 108:376) */}
            <span className="sm:hidden">Find the right providers for you</span>
            <span className="hidden sm:inline">Find the right provider for you</span>
          </>
        }
        subtitle={
          <>
            <span className="sm:hidden">
              Search thousands of verified psychologists and providers. Start feeling better
              sooner.
            </span>
            <span className="hidden sm:inline">
              Psychologists, therapists and medication management providers. Start feeling
              better sooner.
            </span>
          </>
        }
      />

      <div className={`${GUTTER} pt-10 pb-16 sm:pt-12 sm:pb-20 md:pb-24`}>
        <Reveal trigger="load" delay={360} className="flex w-full flex-col items-center">
          <HeroSearch />
        </Reveal>
        <TrustRow />
      </div>
    </div>
  );
}
