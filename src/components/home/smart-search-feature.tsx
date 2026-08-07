const tabs = ["Smart search", "Verified profiles", "Book in seconds", "Complete confidentiality"];

export function SmartSearchFeature() {
  return (
    <section className="w-full flex flex-col items-center gap-12 px-4 sm:px-12 md:px-20 py-12">
      <div className="flex flex-col items-center gap-6 w-full max-w-[1052px]">
        <span className="inline-flex items-center gap-3 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-[18px] py-2 text-lg font-medium">
          <img src="/images/home/discovery-icon-32.svg" alt="" width={32} height={32} />
          <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
            Discovery
          </span>
        </span>
        <h2 className="font-display text-warm-900 text-display-md tracking-[-0.46px] text-center">
          Everything you need to begin your journey
        </h2>
      </div>

      <div className="w-full max-w-[1052px] flex flex-col gap-5">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 md:flex-nowrap md:justify-center md:gap-[68px] font-display text-lg sm:text-display-xs whitespace-nowrap">
          {tabs.map((tab, i) => (
            <span key={tab} className={i === 0 ? "underline text-warm-950" : "text-warm-600"}>
              {tab}
            </span>
          ))}
        </div>

        {/* Feature card: faint lined-paper texture peeking behind a raised card, matches the Figma frame 1:1 */}
        <div className="paper-bg relative w-full rounded-[10px] overflow-hidden p-4 sm:p-6">
          {/* pink washi-tape decorations */}
          <div
            className="hidden md:block absolute -top-6 -left-10 w-40 h-12 bg-[#ffd9dc]"
            style={{ transform: "rotate(129.6deg) scaleY(-1)" }}
          />
          <div
            className="hidden md:block absolute -top-6 -right-10 w-40 h-12 bg-[#ffd9dc]"
            style={{ transform: "rotate(50.4deg)" }}
          />

          <div className="relative rounded-[24px] border border-warm-300 bg-warm-50 flex flex-col md:flex-row overflow-hidden">
            <div className="flex flex-col justify-center gap-11 flex-1 min-w-0 md:max-w-[400px] p-6 sm:p-9">
              <div className="flex flex-col gap-6">
                <h3 className="font-display-alt text-display-md text-text-primary">Smart search</h3>
                <p className="text-lg sm:text-display-xs text-text-secondary max-w-[371px]">
                  Find providers by specialty, approach, language, gender, and price range.
                  <br />
                  <br />
                  Search is tailored to what matters to you.
                </p>
              </div>
              <a
                href="/providers"
                className="inline-flex w-fit items-center gap-3 rounded-pill bg-warm-800 px-6 py-3 text-xl font-medium text-white"
              >
                <img src="/images/home/browse-providers-icon.svg" alt="" width={24} height={24} />
                Browse providers
              </a>
            </div>

            {/* Full-bleed panel: flush against the left content and the card's own top/right/bottom edges, no gap or independent rounding */}
            <div className="flex-1 min-w-0 -ml-px bg-warm-100 relative min-h-[420px] p-6 flex flex-col gap-6">
              <div className="rounded-4xl border border-warm-300 bg-warm-200 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 px-2 py-2 w-full min-w-0">
                <div className="rounded-4xl bg-warm-100 flex flex-col gap-3 p-4 shrink-0">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <span className="text-text-placeholder">In-person</span>
                    <span className="text-text-primary">Online</span>
                  </div>
                  <div className="relative h-5 w-[70px] rounded-full bg-warm-200">
                    <div className="absolute right-0 top-0 h-5 w-5 rounded-full bg-brand-primary" />
                  </div>
                </div>
                <div className="rounded-4xl bg-warm-100 flex flex-col gap-1.5 p-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">What&apos;s on your mind?</p>
                  <p className="text-sm text-text-placeholder">
                    I need help with <span className="font-medium text-text-primary">Anxiety</span>
                  </p>
                </div>
                <button
                  aria-label="Search"
                  className="rounded-full bg-brand-primary p-3 shrink-0"
                >
                  <img src="/images/home/search-button-icon.svg" alt="" width={20} height={20} />
                </button>
              </div>

              <div className="flex-1 rounded-[24px] bg-warm-25 border border-dashed border-warm-300" />
            </div>
          </div>
        </div>
      </div>

      <p className="font-display text-text-tertiary text-lg text-center tracking-[-0.46px] max-w-[462px]">
        &ldquo;PsychMind makes it simple to find the right professional&rdquo; — no referrals, no
        waitlists, no awkward phone calls.
      </p>
    </section>
  );
}
