import Image from "next/image";

// Mobile-only: this card (and the flow around it) doesn't exist in the desktop
// design (node 108:376) — it's specific to the mobile layout (node 276:774).
export function TestimonialCard() {
  return (
    <section className="md:hidden w-full flex flex-col items-center gap-10 px-4 py-10">
      <div className="relative w-full max-w-[346px] -rotate-[1.4deg] rounded-[14px] border border-black/20 bg-[#ffffe9] shadow-[0px_12px_17px_0px_rgba(0,0,0,0.25)] p-3">
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-16">
            <Image src="/images/home/review-photo-left.png" alt="" fill className="object-cover object-bottom" />
          </div>
          <div className="absolute right-0 top-0 h-full w-14">
            <Image src="/images/home/review-photo-right.png" alt="" fill className="object-cover object-bottom" />
          </div>

          <div className="flex flex-col items-center gap-3 px-14 py-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-black/10 pl-1 pr-2 py-1 text-xs font-medium">
              <img src="/images/home/reviews-badge-icon.svg" alt="" width={14} height={14} />
              <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
                Reviews
              </span>
            </span>
            <p className="font-display text-lg text-[#1c1c1c] tracking-[-0.2px]">
              &ldquo;I was nervous about the whole thing but being able to message the provider
              first made it so much easier.&rdquo;
            </p>
            <p className="font-display text-sm text-warm-600">Sara A. - Needed help with ADHD</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          aria-label="Previous review"
          className="flex size-11 items-center justify-center rounded-md border border-warm-300"
        >
          <img src="/images/home/nav-arrow-icon.svg" alt="" width={18} height={18} className="rotate-180" />
        </button>
        <button
          aria-label="Next review"
          className="flex size-11 items-center justify-center rounded-md border border-warm-300"
        >
          <img src="/images/home/nav-arrow-icon.svg" alt="" width={18} height={18} />
        </button>
      </div>
    </section>
  );
}
