import Link from "next/link";

const steps = [
  {
    title: "Tell us what you are looking for",
    description:
      "Answer a few simple questions — where you are, what you'd like to work on, and any preferences about your provider. No medical history required. There are no wrong answers.",
  },
  {
    title: "Browse matched profiles",
    description:
      "We surface providers that fit your search. Read their approach, check their availability, and message them directly before committing to anything.",
  },
  {
    title: "Book your first session",
    description:
      "Pick a time that works for you — online or in person. Your first session is a conversation, not a commitment. You can always switch providers.",
  },
];

export function ProcessSteps() {
  return (
    <section className="w-full flex flex-col items-center gap-10 px-4 sm:px-12 md:px-20 py-12">
      <div className="flex flex-col items-start gap-6 w-full max-w-[1052px]">
        <span className="inline-flex items-center gap-3 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-[18px] py-2 text-lg font-medium">
          <img src="/images/how-it-works/process-badge-icon.svg" alt="" width={32} height={32} />
          <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
            The process
          </span>
        </span>
        <h2 className="font-display text-warm-900 text-display-md tracking-[-0.46px]">
          Three steps to your first session
        </h2>
      </div>

      <div className="w-full max-w-[1052px] flex flex-col lg:flex-row gap-10 lg:gap-11 items-start">
        <ol className="flex flex-1 flex-col w-full">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-6">
              <div className="flex flex-col items-center">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warm-200 font-display text-lg text-warm-950">
                  {i + 1}
                </span>
                {i < steps.length - 1 && <span className="w-px flex-1 bg-warm-300 my-1" />}
              </div>
              <div className="flex flex-col gap-4 pb-10 pt-2">
                <div className="flex flex-col gap-1">
                  <p className="text-xl font-semibold text-text-primary">{step.title}</p>
                  <p className="text-lg text-text-placeholder">{step.description}</p>
                </div>
                {i === steps.length - 1 && (
                  <Link
                    href="/providers"
                    className="inline-flex w-fit items-center gap-3 rounded-pill bg-brand-primary px-6 py-3 text-xl font-medium text-white hover:opacity-90 transition-opacity"
                  >
                    Start your search
                    <img src="/images/how-it-works/cta-arrow-icon.svg" alt="" width={24} height={24} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="flex-1 w-full rounded-[20px] bg-warm-200 relative overflow-hidden min-h-[300px] sm:min-h-[420px] p-4 sm:p-6 flex flex-col gap-4">
          <div className="rounded-4xl border border-warm-300 bg-warm-200 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 px-2 py-2 w-full min-w-0">
            <div className="rounded-4xl bg-warm-100 flex flex-col gap-3 p-4 shrink-0">
              <div className="flex items-center gap-3 text-sm font-medium">
                <span className="text-text-placeholder">In-person</span>
                <span className="text-text-primary">Online</span>
              </div>
              <div className="relative h-5 w-[70px] rounded-full bg-warm-25">
                <div className="absolute right-0 top-0 h-5 w-5 rounded-full bg-brand-primary" />
              </div>
            </div>
            <div className="rounded-4xl bg-warm-100 flex flex-col gap-1.5 p-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">What&apos;s on your mind?</p>
              <p className="text-sm text-text-placeholder">
                I need help with <span className="font-medium text-text-primary">Anxiety</span>
              </p>
            </div>
            <button aria-label="Search" className="rounded-full bg-brand-primary p-3 shrink-0">
              <img src="/images/how-it-works/search-button-icon.svg" alt="" width={20} height={20} />
            </button>
          </div>

          <div className="flex-1 rounded-[24px] bg-warm-50" />
        </div>
      </div>
    </section>
  );
}
