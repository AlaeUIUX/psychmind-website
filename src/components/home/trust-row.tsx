"use client";

import { cn } from "cn";
import { useRef } from "react";
import { Reveal } from "@/components/reveal";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// The platform figures, folded into a quiet row under the hero search. Each
// number carries a footnote that defines exactly what it measures.
// TODO(client): confirm each definition and the data source line below.
type Stat = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  star?: boolean;
  note: string;
};

const stats: Stat[] = [
  {
    value: 2400,
    suffix: "+",
    label: "verified professionals",
    note: "Providers whose license and identity have been checked by the PsychMind team.",
  },
  {
    value: 24,
    prefix: "< ",
    suffix: "h",
    label: "avg. time to first session",
    note: "Average time between sending a session request and the first session.",
  },
  {
    value: 4.8,
    decimals: 1,
    star: true,
    label: "average provider rating",
    note: "Average rating clients leave after a session.",
  },
];

const SOURCE = "Source: PsychMind platform data.";

function format(stat: Stat, n: number) {
  const body = n.toLocaleString("en-US", {
    minimumFractionDigits: stat.decimals ?? 0,
    maximumFractionDigits: stat.decimals ?? 0,
  });
  return `${stat.prefix ?? ""}${body}${stat.suffix ?? ""}`;
}

function Figure({ stat, index }: { stat: Stat; index: number }) {
  const numRef = useRef<HTMLSpanElement>(null);

  // One count-up as the hero settles — the only timed motion in the hero.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const el = numRef.current;
      if (!el) return;
      const counter = { v: 0 };
      el.textContent = format(stat, 0);
      gsap.to(counter, {
        v: stat.value,
        duration: 1.8,
        delay: 0.9 + index * 0.12,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = format(stat, counter.v);
        },
      });
    });
    return () => mm.revert();
  });

  const n = index + 1;
  return (
    <div className="group relative flex flex-col items-center gap-1 px-3 text-center">
      <p className="flex items-center gap-1 font-display text-[28px] leading-9 tracking-[-0.02em] text-warm-950 sm:text-[32px] sm:leading-10">
        <span ref={numRef} className="tabular-nums">
          {format(stat, stat.value)}
        </span>
        {stat.star && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/images/home/star-icon.svg" alt="" className="size-[0.5em]" />
        )}
        <a
          href={`#stat-note-${n}`}
          aria-label={`Note ${n}: ${stat.note}`}
          className="-mt-3 ml-0.5 font-sans text-[11px] font-medium text-text-placeholder transition-colors hover:text-brand-primary"
        >
          {n}
        </a>
      </p>
      <p className="type-small text-text-tertiary">{stat.label}</p>
      {/* Hover definition */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 max-lg:hidden -translate-x-1/2 translate-y-1 rounded-field bg-warm-900 px-3 py-2 text-left text-xs leading-4 text-warm-100 opacity-0 shadow-raised transition-[opacity,translate] duration-300 ease-out-soft group-hover:translate-y-0 group-hover:opacity-100"
      >
        {stat.note}
      </span>
    </div>
  );
}

export function TrustRow() {
  return (
    <Reveal trigger="load" delay={620} className="mx-auto mt-10 flex w-full max-w-[1052px] flex-col gap-5 sm:mt-14">
      <div className="grid grid-cols-2 gap-y-6 border-t border-warm-200 pt-7 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={stat.label} className={cn(i > 0 && "lg:border-l lg:border-warm-200", i % 2 === 1 && "border-l border-warm-200 lg:border-l")}>
            <Figure stat={stat} index={i} />
          </div>
        ))}
        {/* Not a number — a promise. */}
        <div className="flex flex-col items-center gap-1 border-l border-warm-200 px-3 text-center">
          <p className="flex h-9 items-center gap-2 text-warm-950 sm:h-10">
            <span className="flex size-8 items-center justify-center rounded-full bg-warm-900 text-white">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                <rect x="5.5" y="11" width="13" height="9" rx="2.5" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="font-display text-xl sm:text-2xl">Confidential</span>
          </p>
          <p className="type-small text-text-tertiary">your search is never shared</p>
        </div>
      </div>
      <p className="mx-auto max-w-[860px] text-center text-[11px] leading-4 text-text-placeholder sm:text-xs">
        {stats.map((stat, i) => (
          <span key={stat.label} id={`stat-note-${i + 1}`} className="mr-2 inline-block scroll-mt-32">
            <sup className="mr-0.5">{i + 1}</sup>
            {stat.note}
          </span>
        ))}
        <span className="inline-block">{SOURCE}</span>
      </p>
    </Reveal>
  );
}
