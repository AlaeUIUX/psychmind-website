import Image from "next/image";

export function Hero() {
  return (
    <section className="w-full flex flex-col items-center pb-20 sm:pb-32 md:pb-40">
      <div className="w-full flex flex-col items-center gap-8 sm:gap-12 px-4 sm:px-8 md:px-20 py-6 sm:py-12">
        <div className="w-full flex flex-col items-center gap-6 py-6 max-w-[720px]">
          <div className="relative w-[220px] h-[146px] sm:w-[300px] sm:h-[200px] md:w-[366px] md:h-[244px]">
            <Image
              src="/images/home/hero-top-illustration.png"
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col items-center gap-4 text-center w-full">
            {/* Mobile design (node 276:774) uses different copy from desktop (node 108:376) */}
            <h1 className="font-display text-warm-900 text-[36px] sm:text-[48px] md:text-display-lg leading-[1.1] md:leading-[60px]">
              <span className="sm:hidden">Find the right providers for you</span>
              <span className="hidden sm:inline">Find the right provider for you</span>
            </h1>
            <p className="text-text-secondary text-lg sm:text-display-xs max-w-[566px]">
              <span className="sm:hidden">
                Search thousands of verified psychologists and providers. Start feeling better
                sooner.
              </span>
              <span className="hidden sm:inline">
                Psychologists, therapists and medication management providers. Start feeling
                better sooner.
              </span>
            </p>
          </div>
        </div>

        <MobileSearchTrigger />
        <SearchTool />
      </div>
    </section>
  );
}

function MobileSearchTrigger() {
  return (
    <button className="sm:hidden w-full max-w-[374px] rounded-[36px] border-[1.5px] border-warm-300 bg-warm-200 p-3">
      <div className="flex items-center justify-between gap-3 rounded-[36px] bg-warm-100 p-6">
        <div className="flex flex-col items-start gap-1 text-left">
          <span className="flex items-center gap-2 text-md font-medium text-text-primary">
            <img src="/images/home/mobile-search-icon.svg" alt="" width={16} height={16} />
            Start search
          </span>
          <span className="text-md text-text-placeholder">Press to get started</span>
        </div>
        <span className="flex shrink-0 items-center justify-center rounded-full bg-brand-primary p-[17px]">
          <img src="/images/home/mobile-search-button-icon.svg" alt="" width={17} height={17} />
        </span>
      </div>
    </button>
  );
}

function Divider() {
  return <div className="hidden md:block w-px self-stretch bg-warm-300" />;
}

function SearchTool() {
  // The row layout below uses Figma's fixed desktop pixel widths (424.5px column, 81px
  // padding, etc.) which only fit at genuinely wide viewports — stay stacked until xl
  // (1280px) rather than md (768px) so it never overflows/clips on laptop-width screens.
  return (
    <div className="hidden sm:flex w-full max-w-[1230px] rounded-[36px] border-[1.5px] border-warm-300 bg-warm-200 p-3 flex-col xl:flex-row items-stretch gap-3 xl:gap-[27px] xl:pr-[30px]">
      <div className="flex-1 rounded-[36px] bg-warm-100 flex flex-col xl:flex-row items-stretch gap-3 xl:gap-[3px] overflow-hidden">
        {/* Physical/Online toggle */}
        <div className="flex flex-col justify-center gap-[18px] p-9 shrink-0 xl:h-[156px]">
          <div className="flex items-center gap-[18px] text-xl font-medium">
            <span className="text-text-placeholder">In-person</span>
            <span className="text-text-primary">Online</span>
          </div>
          <div className="relative h-[30px] w-[178.5px] rounded-full bg-warm-200 flex items-center justify-end p-[1.875px]">
            <div className="h-[26px] w-[26px] rounded-full bg-brand-primary" />
          </div>
        </div>

        <Divider />

        {/* What's on your mind */}
        <div className="flex flex-col justify-center gap-[18px] p-9 shrink-0 xl:h-[156px] xl:w-[424.5px]">
          <p className="text-xl font-medium text-text-primary">What&apos;s on your mind?</p>
          <p className="text-xl text-text-placeholder">What would you like to work on?</p>
        </div>

        <Divider />

        {/* Who feels right */}
        <div className="flex flex-col justify-center gap-[15px] pl-9 pr-9 xl:pr-[81px] py-9 shrink-0 xl:h-[156px]">
          <p className="text-xl font-medium text-text-primary">Who feels right</p>
          <button className="inline-flex w-fit items-center gap-1.5 rounded-xl border-[1.5px] border-warm-300 px-[18px] py-[9px] text-lg font-medium text-text-primary">
            <img src="/images/home/add-preferences-icon.svg" alt="" width={18} height={18} />
            Add preferences
          </button>
        </div>
      </div>

      <button
        aria-label="Search"
        className="self-center flex items-center justify-center rounded-full bg-brand-primary p-9 shrink-0"
      >
        <img src="/images/home/search-button-icon.svg" alt="" width={36} height={36} />
      </button>
    </div>
  );
}
