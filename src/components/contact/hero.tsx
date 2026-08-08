export function Hero() {
  return (
    <section className="w-full flex flex-col items-center gap-6 px-4 sm:px-8 md:px-20 py-6 sm:py-12">
      <div className="w-full flex flex-col items-center gap-4 max-w-[720px]">
        <div className="relative w-[220px] h-[134px] sm:w-[260px] sm:h-[158px] md:w-[296px] md:h-[180px]">
          <img
            src="/images/contact/hero-illustration.svg"
            alt=""
            className="absolute inset-0 size-full object-contain"
          />
        </div>
        <div className="flex flex-col items-center gap-4 text-center w-full">
          <h1 className="font-display text-warm-900 text-[36px] sm:text-[48px] md:text-display-lg leading-[1.1] md:leading-[60px]">
            We would love to hear from you
          </h1>
          <p className="text-text-secondary text-lg sm:text-display-xs max-w-[566px]">
            Whether you have a question, a thought, or just want to say hello
          </p>
        </div>
      </div>
    </section>
  );
}
