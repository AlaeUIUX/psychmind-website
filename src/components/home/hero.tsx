import { Reveal } from "@/components/reveal";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";
import { GUTTER } from "@/components/ui/section";
import { SessionModeSwitch } from "@/components/shared/session-mode-switch";
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
          <MobileSearchTrigger />
          <SearchTool />
        </Reveal>
        <TrustRow />
      </div>
    </div>
  );
}

// Shared surface for the search: white, hairline ring, soft lift — sits on the
// paper like everything else instead of a grey slab.
const searchSurface =
  "bg-white ring-1 ring-warm-200 shadow-[0_1px_2px_rgb(28_25_23/0.04),0_24px_56px_-28px_rgb(28_25_23/0.22)]";

function MobileSearchTrigger() {
  return (
    <div className={`w-full max-w-[440px] rounded-[30px] p-2 xl:hidden ${searchSurface}`}>
      <div className="flex justify-center px-2 pt-1.5 pb-2">
        <SessionModeSwitch size="sm" />
      </div>
      <button
        type="button"
        className="group flex w-full items-center justify-between gap-3 rounded-[24px] bg-warm-50 py-3.5 pr-3 pl-5 text-left ring-1 ring-warm-200/70 ring-inset transition-colors duration-300 hover:bg-warm-100/70"
      >
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 type-body font-medium text-text-primary">
            <SearchIcon className="size-4 text-text-secondary" />
            Start search
          </span>
          <span className="type-body text-text-placeholder">Press to get started</span>
        </span>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-control transition-[scale,background-color] duration-300 ease-out-soft group-hover:scale-105 group-hover:bg-brand-primary-hover">
          <SearchIcon className="size-[18px]" />
        </span>
      </button>
    </div>
  );
}

function Divider() {
  return <div aria-hidden className="my-5 w-px self-stretch bg-warm-200" />;
}

function SearchTool() {
  // The row layout needs genuinely wide viewports. Below xl the compact
  // MobileSearchTrigger covers the whole range instead.
  return (
    <div className={`hidden w-full max-w-[1180px] items-center gap-2 rounded-[40px] p-2.5 xl:flex ${searchSurface}`}>
      {/* Session format */}
      <div className="flex shrink-0 items-center self-stretch rounded-[32px] px-5">
        <SessionModeSwitch />
      </div>

      <Divider />

      {/* What's on your mind */}
      <div className="flex min-w-0 flex-1 cursor-text flex-col justify-center gap-1 self-stretch rounded-[32px] px-7 py-5 transition-colors duration-300 hover:bg-warm-50">
        <p className="text-lg font-medium text-text-primary">What&apos;s on your mind?</p>
        <p className="truncate text-lg text-text-placeholder">What would you like to work on?</p>
      </div>

      <Divider />

      {/* Who feels right */}
      <div className="flex shrink-0 flex-col justify-center gap-2 self-stretch rounded-[32px] px-7 py-5 transition-colors duration-300 hover:bg-warm-50">
        <p className="text-lg font-medium text-text-primary">Who feels right</p>
        <button
          type="button"
          className="inline-flex h-9 w-fit items-center gap-1.5 rounded-pill border border-dashed border-warm-300 px-3.5 text-md font-medium text-text-secondary transition-colors hover:border-warm-600/50 hover:bg-white hover:text-text-primary"
        >
          <PlusIcon className="size-4" />
          Add preferences
        </button>
      </div>

      <button
        type="button"
        aria-label="Search"
        className="ml-2 flex size-[84px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-[0_10px_24px_-10px_rgb(192_16_72/0.6)] transition-[scale,background-color] duration-300 ease-out-soft hover:scale-[1.04] hover:bg-brand-primary-hover active:scale-[0.97]"
      >
        <SearchIcon className="size-7" />
      </button>
    </div>
  );
}
