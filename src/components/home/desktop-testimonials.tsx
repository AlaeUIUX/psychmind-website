import Image from "next/image";

// Desktop-only counterpart to <TestimonialCard /> (which is mobile-only). Figma
// has three "Review" instances (nodes 112:227/246/270, each a different pastel
// color) that fan out into a stacked-deck look — reproduced here as two blank
// color layers peeking behind the front, readable card.
export function DesktopTestimonials() {
  return (
    <section className="hidden md:flex w-full flex-col items-center gap-10 px-12 lg:px-20 py-16">
      <div className="relative w-full max-w-[947px]">
        <div
          className="absolute -top-4 -left-3 right-3 bottom-4 rounded-[20px] bg-[#e3f9ee] -rotate-1"
          aria-hidden
        />
        <div
          className="absolute -top-2 -right-2 left-2 bottom-2 rounded-[20px] bg-[#efeefc] rotate-1"
          aria-hidden
        />

        <div className="relative rounded-[20px] bg-[#ffffe9] overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-[220px] lg:w-[300px]">
            <Image src="/images/home/testimonial-doodle-left.png" alt="" fill className="object-cover object-bottom" />
          </div>
          <div className="absolute right-0 top-0 h-full w-[180px] lg:w-[250px]">
            <Image src="/images/home/testimonial-doodle-right.png" alt="" fill className="object-cover object-bottom" />
          </div>

          <div className="relative flex flex-col items-center gap-6 px-[220px] lg:px-[300px] py-16 text-center">
            <span className="inline-flex items-center gap-2.5 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-4 py-2 text-lg font-medium">
              <img src="/images/home/reviews-badge-icon.svg" alt="" width={28} height={28} />
              <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
                Reviews
              </span>
            </span>
            <p className="font-display text-[32px] text-[#1c1c1c] tracking-[-0.4px] leading-[1.35]">
              &ldquo;I was nervous about the whole thing but being able to message the provider
              first made it so much easier.&rdquo;
            </p>
            <p className="font-display text-xl text-warm-600">Sara A. - Needed help with ADHD</p>
          </div>
        </div>
      </div>
    </section>
  );
}
