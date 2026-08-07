"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    question: "Is my search completely private?",
    answer:
      "Yes. We never share your personal information with anyone — not your provider, not third parties. Your search is yours alone.",
  },
  { question: "What if I pick the wrong person?" },
  { question: "What is your cancellation policy?" },
  { question: "Do I need a referral or diagnosis?" },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="w-full flex flex-col items-center gap-16 px-4 sm:px-12 md:px-20 py-16 sm:py-24">
      <div className="flex flex-col items-center gap-5 text-center max-w-[768px]">
        <span className="inline-flex items-center gap-3 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-[18px] py-2 text-lg font-medium">
          <img src="/images/how-it-works/faq-badge-icon.svg" alt="" width={32} height={32} />
          <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
            Common questions
          </span>
        </span>
        <h2 className="font-display text-warm-900 text-display-md tracking-[-0.46px]">
          A few things people wonder before starting
        </h2>
      </div>

      <div className="w-full max-w-[768px] flex flex-col">
        {faqs.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div key={faq.question} className={i > 0 ? "border-t border-warm-200 pt-6 mt-6" : ""}>
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-start justify-between gap-4 text-left"
                aria-expanded={open}
              >
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-warm-900">{faq.question}</p>
                  {open && faq.answer && (
                    <p className="text-text-secondary">{faq.answer}</p>
                  )}
                </div>
                <span className="shrink-0 flex size-6 items-center justify-center rounded-full border border-warm-300 text-warm-600">
                  {open ? "−" : "+"}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-[1216px] rounded-2xl bg-warm-50 flex flex-col items-center gap-8 px-8 pt-8 pb-10">
        <div className="flex -space-x-3">
          {["avatar-1.png", "avatar-2.png", "avatar-3.png"].map((src, i) => (
            <img
              key={src}
              src={`/images/how-it-works/${src}`}
              alt=""
              className="rounded-full border-2 border-white object-cover"
              style={{ width: i === 1 ? 56 : 48, height: i === 1 ? 56 : 48, zIndex: i === 1 ? 1 : 0 }}
            />
          ))}
        </div>
        <div className="flex flex-col items-center gap-2 text-center max-w-[768px]">
          <p className="font-display text-display-sm text-text-primary">Still have questions?</p>
          <p className="text-md text-text-secondary max-w-[358px]">
            Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-3 rounded-pill bg-warm-800 px-6 py-3 text-xl font-medium text-white hover:bg-warm-900 transition-colors"
        >
          Contact us
          <img src="/images/how-it-works/contact-icon.svg" alt="" width={24} height={24} />
        </Link>
      </div>
    </section>
  );
}
