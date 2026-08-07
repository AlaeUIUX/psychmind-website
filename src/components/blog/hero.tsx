import Image from "next/image";

export function Hero() {
  return (
    <section className="w-full flex flex-col items-center gap-8 sm:gap-12 px-4 sm:px-8 md:px-20 py-6 sm:py-12">
      <div className="w-full flex flex-col items-center gap-6 max-w-[720px]">
        <div className="relative w-[220px] h-[146px] sm:w-[300px] sm:h-[200px] md:w-[366px] md:h-[244px]">
          <Image
            src="/images/blog/hero-illustration.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col items-center gap-4 text-center w-full">
          <h1 className="font-display text-warm-900 text-[36px] sm:text-[48px] md:text-display-lg leading-[1.1] md:leading-[60px]">
            Resource center
          </h1>
          <p className="text-text-secondary text-lg sm:text-display-xs max-w-[566px]">
            Guides, insights, and perspectives on mental health — written by your providers
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
        {/* Mobile stacks full-width with Lifeline first; desktop sits side by side with Call first */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full sm:w-auto">
          <button className="order-2 sm:order-1 w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-lg border border-warm-200 bg-white px-8 py-3.5 text-md font-medium text-warm-800 shadow-sm">
            Call
            <img src="/images/blog/phone-icon.svg" alt="" width={16} height={16} />
          </button>
          <button className="order-1 sm:order-2 w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-lg border border-warm-200 bg-white px-8 py-3.5 text-md font-medium text-warm-800 shadow-sm">
            988 Suicide &amp; Crisis Lifeline
            <img src="/images/blog/arrow-up-right-icon.svg" alt="" width={16} height={16} />
          </button>
        </div>
        <p className="text-text-secondary text-md">If you need to talk, the 988 Lifeline is here</p>
      </div>
    </section>
  );
}
