import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="w-full flex flex-col items-center gap-8 sm:gap-12 px-4 sm:px-8 md:px-20 py-6 sm:py-12 pb-20 sm:pb-32 md:pb-40">
      <div className="w-full flex flex-col items-center gap-6 max-w-[720px]">
        <div className="relative w-[220px] h-[146px] sm:w-[300px] sm:h-[200px] md:w-[366px] md:h-[244px]">
          <Image
            src="/images/how-it-works/hero-illustration.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col items-center gap-4 text-center w-full">
          <h1 className="font-display text-warm-900 text-[36px] sm:text-[48px] md:text-display-lg leading-[1.1] md:leading-[60px]">
            Finding the right provider should feel simple
          </h1>
          <p className="text-text-secondary text-lg sm:text-display-xs max-w-[566px]">
            No referrals. No waitlists. Just a clear, guided path to the professional who is
            right for you.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/providers"
          className="inline-flex items-center gap-3 rounded-pill bg-brand-primary px-6 py-3 text-xl font-medium text-white hover:opacity-90 transition-opacity"
        >
          Start your search
          <img src="/images/how-it-works/cta-arrow-icon.svg" alt="" width={24} height={24} />
        </Link>
        <p className="text-text-secondary text-md">Takes less than 2 minutes. Free to browse.</p>
      </div>
    </section>
  );
}
