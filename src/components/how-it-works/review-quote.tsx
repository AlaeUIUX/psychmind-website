export function ReviewQuote() {
  return (
    <section className="w-full flex justify-center px-4 sm:px-12 md:px-20 py-12">
      <div className="w-full max-w-[947px] rounded-2xl bg-warm-100 flex flex-col items-center gap-6 px-8 py-12 sm:py-16 text-center">
        <span className="inline-flex items-center gap-2.5 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-4 py-1.5 text-md font-medium">
          <img src="/images/how-it-works/reviews-badge-icon.svg" alt="" width={28} height={28} />
          <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
            Reviews
          </span>
        </span>
        <p className="font-display text-2xl sm:text-[32px] text-[#1c1c1c] tracking-[-0.4px] leading-snug max-w-[860px]">
          &ldquo;I had tried to find a provider for months. PsychMind took me twenty minutes.
          I&apos;ve been seeing my provider for six months now.&rdquo;
        </p>
        <p className="font-display text-xl text-warm-600">Sara A. - Needed help with ADHD</p>
      </div>
    </section>
  );
}
