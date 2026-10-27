import { Reveal } from "@/components/reveal";
import { HeroSearch } from "./hero-search";
import { Showcase } from "./showcase";
import { TrustRow } from "./trust-row";

// The home hero, after sort.to: the morphing stat pill where sort.to has its
// eyebrow, serif H1 and lede, then the search bar where sort.to has its
// button, and the painted band. No top padding: the header already leaves
// sort.to's 40px under the nav row.
export function Hero() {
  return (
    <div id="hero" className="w-full">
      <section className="px-6 text-center">
        <Reveal trigger="load">
          <div className="type-scope-sort">
            <TrustRow />
          </div>
          <h1 className="type-hero-title mt-4">
            {/* Mobile design (node 276:774) uses different copy from desktop (node 108:376) */}
            <span className="sm:hidden">Find the right providers for you</span>
            <span className="hidden sm:inline">Find the right provider for you</span>
          </h1>
          <p className="type-hero-lede mx-auto mt-4 max-w-xl text-balance">
            <span className="sm:hidden">Search thousands of verified psychologists and providers.</span>
            <span className="hidden sm:inline">Psychologists, therapists and medication management providers.</span>
          </p>
          {/* #hero-search: where the floating "Start a search" shortcut brings you back to */}
          <div id="hero-search" className="type-scope-sort @container mt-8 flex w-full justify-center text-left">
            <HeroSearch />
          </div>
        </Reveal>
      </section>

      <Showcase />
    </div>
  );
}
