import { Reveal } from "@/components/reveal";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";
import { GUTTER } from "@/components/ui/section";

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

      <div className={`${GUTTER} pt-10 pb-16 sm:pt-12 sm:pb-24 md:pb-28`}>
        <Reveal trigger="load" delay={360} className="flex w-full flex-col items-center">
          <MobileSearchTrigger />
          <SearchTool />
        </Reveal>
      </div>
    </div>
  );
}

function MobileSearchTrigger() {
  return (
    <button
      type="button"
      className="group xl:hidden w-full max-w-[420px] rounded-panel border border-warm-300 bg-warm-200 p-2 text-left shadow-control transition-shadow duration-300 ease-out-soft hover:shadow-card"
    >
      <span className="flex items-center justify-between gap-3 rounded-[28px] bg-warm-100 py-4 pr-4 pl-6">
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 type-body font-medium text-text-primary">
            <SearchIcon className="size-4 text-text-secondary" />
            Start search
          </span>
          <span className="type-body text-text-placeholder">Press to get started</span>
        </span>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition-[scale,background-color] duration-300 ease-out-soft group-hover:scale-105 group-hover:bg-brand-primary-hover">
          <SearchIcon className="size-[18px]" />
        </span>
      </span>
    </button>
  );
}

function Divider() {
  return <div className="w-px self-stretch my-6 bg-warm-300" />;
}

function SearchTool() {
  // The row layout below uses Figma's fixed desktop widths, which only fit at
  // genuinely wide viewports. Rather than falling back to a stacked-but-still-
  // desktop-styled layout between sm and xl, the compact MobileSearchTrigger
  // covers that whole range and this only renders once xl has room for it.
  return (
    <div className="hidden xl:flex w-full max-w-[1230px] items-center gap-6 rounded-panel border border-warm-300 bg-warm-200 p-3 pr-6 shadow-control">
      <div className="flex h-[156px] flex-1 items-stretch overflow-hidden rounded-4xl bg-warm-100">
        {/* In-person / Online toggle */}
        <div className="flex shrink-0 flex-col justify-center gap-4 px-9 transition-colors duration-300 hover:bg-warm-50/70">
          <div className="flex items-center gap-4 text-xl font-medium">
            <span className="text-text-placeholder">In-person</span>
            <span className="text-text-primary">Online</span>
          </div>
          <div className="flex h-[30px] w-44 items-center justify-end rounded-full bg-warm-200 p-0.5">
            <div className="size-[26px] rounded-full bg-brand-primary shadow-control" />
          </div>
        </div>

        <Divider />

        {/* What's on your mind */}
        <div className="flex w-[420px] shrink-0 flex-col justify-center gap-4 px-9 transition-colors duration-300 hover:bg-warm-50/70">
          <p className="text-xl font-medium text-text-primary">What&apos;s on your mind?</p>
          <p className="text-xl text-text-placeholder">What would you like to work on?</p>
        </div>

        <Divider />

        {/* Who feels right */}
        <div className="flex flex-1 flex-col justify-center gap-4 px-9 transition-colors duration-300 hover:bg-warm-50/70">
          <p className="text-xl font-medium text-text-primary">Who feels right</p>
          <button
            type="button"
            className="inline-flex h-11 w-fit items-center gap-1.5 rounded-field border border-warm-300 px-4 text-lg font-medium text-text-primary transition-colors hover:border-warm-600/40 hover:bg-white"
          >
            <PlusIcon className="size-[18px] text-text-secondary" />
            Add preferences
          </button>
        </div>
      </div>

      <button
        type="button"
        aria-label="Search"
        className="flex size-26 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-card transition-[scale,background-color] duration-300 ease-out-soft hover:scale-[1.04] hover:bg-brand-primary-hover active:scale-[0.97]"
      >
        <SearchIcon className="size-9" />
      </button>
    </div>
  );
}
