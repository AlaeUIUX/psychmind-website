"use client";

import Image from "next/image";

const socials = [
  { label: "X (Twitter)", icon: "x-icon.svg", href: "#" },
  { label: "Facebook", icon: "facebook-icon.svg", href: "#" },
  { label: "LinkedIn", icon: "linkedin-icon.svg", href: "#" },
];

export function MissionArticle() {
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <article className="w-full flex flex-col items-center gap-12 px-4 sm:px-12 md:px-20 py-12 pb-32 sm:pb-40">
      <div className="flex flex-col items-center gap-4 text-center max-w-[720px]">
        <p className="text-text-secondary text-display-xs">Our mission</p>
        <h1 className="font-display text-warm-900 text-[36px] sm:text-[48px] md:text-display-lg leading-[1.1] md:leading-[60px]">
          The home for your mind&apos;s wellbeing
        </h1>
      </div>

      <div className="relative w-[280px] h-[188px] sm:w-[500px] sm:h-[216px] md:w-[668px] md:h-[288px]">
        <Image src="/images/mission/hero-illustration.png" alt="" fill className="object-contain" priority />
      </div>

      <div className="w-full max-w-[720px] flex flex-col gap-12">
        <div className="flex flex-col gap-7 text-lg text-text-tertiary">
          <p>
            PsychMind was created by Dani, a mental health provider and small practice owner,
            and Bri, who works behind the scenes supporting patients every day.
          </p>
          <p>As larger platforms grew, they noticed something important getting lost;</p>
          <p>
            Connection, visibility for independent providers, and a simple way for patients to
            find the right fit. Existing directories didn&apos;t reflect how providers actually
            practice — across multiple states, licenses, and locations.
          </p>
          <p>
            PsychMind was built to change that: making it easier for patients to find care, and
            for providers to be seen.
          </p>
        </div>

        <div className="flex gap-5">
          <span className="w-0.5 shrink-0 bg-brand-primary rounded-full" />
          <p className="font-medium text-display-xs text-text-primary py-2">
            If you are here for the first time, welcome!
            <br />
            We are glad you found us.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-warm-200 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <span className="flex size-10 items-center justify-center rounded-full border border-warm-200 bg-warm-100 shadow-[0_0_0_1.5px_white]">
                <img src="/images/mission/user-icon.svg" alt="" width={16} height={16} />
              </span>
              <span className="flex size-10 items-center justify-center rounded-full border border-warm-200 bg-warm-100 shadow-[0_0_0_1.5px_white]">
                <img src="/images/mission/user-icon.svg" alt="" width={16} height={16} />
              </span>
            </div>
            <div>
              <p className="font-semibold text-text-primary">PsychMind Team</p>
              <p className="text-text-tertiary">PsychMind co-founders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-md border border-warm-300 bg-warm-100 px-3.5 py-2.5 text-sm font-semibold text-warm-700 shadow-xs"
            >
              <img src="/images/mission/copy-icon.svg" alt="" width={20} height={20} />
              Copy link
            </button>
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex items-center justify-center rounded-md border border-warm-300 bg-warm-100 p-2.5 shadow-xs"
              >
                <img src={`/images/mission/${social.icon}`} alt="" width={20} height={20} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
