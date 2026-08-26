export function MissionTeaser() {
  return (
    <section className="w-full flex flex-col items-center gap-12 px-4 sm:px-12 md:px-20 py-12">
      <div className="flex flex-col items-start gap-6 w-full max-w-[1052px]">
        <span className="inline-flex items-center gap-3 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-[18px] py-2 text-lg font-medium">
          <img src="/images/home/meet-creators-icon.svg" alt="" width={32} height={32} />
          <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
            Meet the creators
          </span>
        </span>
      </div>

      <div className="relative flex flex-col items-start gap-10 w-full max-w-[1052px]">
        {/* Figma applies no object-fit override here (defaults to stretch-to-fill on
            the square source), so the illustration is intentionally non-uniformly
            scaled to this exact 436:347 box rather than letterboxed or cropped. */}
        <img
          src="/images/home/mission-illustration.png"
          alt=""
          className="w-[220px] h-[175px] sm:w-[436px] sm:h-[347px]"
        />

        {/* Lavender washi-tape accents */}
        <div
          className="hidden md:block absolute w-[214px] h-[65px] bg-[#e0d9ff] right-[-40px] top-[220px]"
          style={{ transform: "rotate(50.41deg)" }}
        />
        <div
          className="hidden md:block absolute w-[214px] h-[65px] bg-[#e0d9ff] left-[-90px] bottom-[-40px]"
          style={{ transform: "rotate(50.41deg)" }}
        />

        <div className="paper-bg relative w-full rounded-[10px] shadow-[0px_4px_34px_0px_rgba(0,0,0,0.15)] px-6 py-10 sm:px-16 sm:py-12 md:px-24 md:py-14 overflow-hidden">
          <div className="absolute inset-0 bg-warm-25/60" />
          <div className="flex flex-col gap-8 sm:gap-12 relative">
            <p className="font-display text-[24px] sm:text-[36px] leading-[1.4] sm:leading-[60px] tracking-[-1.5px] text-[rgba(28,28,28,0.55)]">
              We started <span className="text-[#1c1c1c]">PsychMind</span> because{" "}
              <span className="underline text-[#1c1c1c]">
                people spent too long looking for help
              </span>{" "}
              and not finding it — not because the help wasn&apos;t there, but because the
              path to it was{" "}
              <span className="text-[#1c1c1c]">confusing, cold, and sometimes just discouraging</span>
              . We&apos;re two people who believe that finding a provider should feel{" "}
              <span className="text-[#1c1c1c]">as safe as the therapy itself.</span>
            </p>
            <div className="inline-flex items-center rounded-pill border-2 border-black/10 bg-warm-25 px-5 py-3 sm:px-9 sm:py-4 w-fit">
              <p className="text-lg sm:text-display-sm font-medium bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
                PsychMind is our attempt to close that gap
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
