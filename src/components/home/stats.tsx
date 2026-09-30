"use client";

import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/reveal";
import { Container, GUTTER } from "@/components/ui/section";

type Stat = {
  /** Numeric part that counts up. */
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  star?: boolean;
};

const stats: Stat[] = [
  { value: 2400, suffix: "+", label: "verified professionals" },
  { value: 24, prefix: "< ", suffix: "h", label: "avg. time to first session" },
  { value: 4.8, decimals: 1, label: "average provider rating", star: true },
  { value: 100, suffix: "%", label: "confidential & private" },
];

const COUNT_MS = 1600;

function format(stat: Stat, n: number) {
  const body = n.toLocaleString("en-US", {
    minimumFractionDigits: stat.decimals ?? 0,
    maximumFractionDigits: stat.decimals ?? 0,
  });
  return `${stat.prefix ?? ""}${body}${stat.suffix ?? ""}`;
}

// Server-renders the final number (so it's always correct without JS), then
// counts up from zero the first time it scrolls into view.
function CountUp({ stat, delay }: { stat: Stat; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(stat.value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let timeout: ReturnType<typeof setTimeout>;
    setN(0);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timeout = setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / COUNT_MS);
            const eased = 1 - Math.pow(1 - t, 4);
            setN(stat.value * eased);
            if (t < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }, delay);
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [stat.value, delay]);

  return (
    <span ref={ref} aria-label={format(stat, stat.value)}>
      <span aria-hidden>{format(stat, n)}</span>
    </span>
  );
}

export function Stats() {
  return (
    <div className={cn("w-full border-y border-warm-200 bg-warm-100", GUTTER)}>
      <Container>
        <Reveal stagger as="ul" className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <li
              key={stat.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 px-3 py-8 text-center sm:py-10",
                "border-warm-200",
                i % 2 === 1 && "border-l",
                i >= 2 && "border-t md:border-t-0",
                i === 2 && "md:border-l",
              )}
            >
              <p className="type-stat flex items-center gap-1.5 text-warm-950">
                <CountUp stat={stat} delay={i * 80} />
                {stat.star && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/images/home/star-icon.svg" alt="" className="size-[0.55em]" />
                )}
              </p>
              <p className="type-small font-medium text-text-tertiary sm:type-body sm:font-medium">
                {stat.label}
              </p>
            </li>
          ))}
        </Reveal>
      </Container>
    </div>
  );
}
