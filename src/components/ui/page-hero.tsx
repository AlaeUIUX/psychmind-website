import { cn } from "cn";
import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { DoodleSparkle } from "@/components/ui/doodles";
import { GUTTER } from "@/components/ui/section";

type PageHeroProps = {
  illustration?: {
    src: string;
    /** Size classes for the illustration box; defaults to the standard 3:2 hero size. */
    className?: string;
    fit?: "cover" | "contain";
    /** Render the illustration below the title instead of above it. */
    after?: boolean;
  };
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** CTAs / captions under the text block. */
  children?: ReactNode;
  /** `blush` sets the hero on a tinted, grained panel — a change of scene for pages like Mission. */
  tone?: "paper" | "blush";
  className?: string;
};

// The opening of every top-level page: illustration, H1, lede, actions.
// Each line plays in on first paint, one after another, without waiting for
// JS; the illustration then keeps a slow, barely-there float.
export function PageHero({ illustration, eyebrow, title, subtitle, children, tone = "paper", className }: PageHeroProps) {
  const art = illustration && (
    <div
      className={cn(
        "relative aspect-[3/2] w-[220px] sm:w-[300px] md:w-[366px]",
        illustration.after ? "mt-4 sm:mt-6" : "mb-2 sm:mb-4",
        illustration.className,
      )}
    >
      <Image
        src={illustration.src}
        alt=""
        fill
        priority
        sizes="(min-width: 768px) 668px, 500px"
        className={cn(
          "animate-float",
          illustration.fit === "contain" ? "object-contain" : "object-cover",
        )}
      />
    </div>
  );

  const content = (
    <Reveal
      trigger="load"
      className="relative mx-auto flex w-full max-w-[720px] flex-col items-center gap-4 text-center"
    >
      {!illustration?.after && art}
      {eyebrow && <p className="type-lead text-text-secondary">{eyebrow}</p>}
      <h1 className="type-display text-text-primary">{title}</h1>
      {subtitle && <p className="type-lead max-w-[566px] text-text-secondary">{subtitle}</p>}
      {illustration?.after && art}
      {children && <div className="mt-4 flex w-full flex-col items-center gap-3 sm:mt-6">{children}</div>}
    </Reveal>
  );

  if (tone === "blush") {
    return (
      <section className={cn("w-full px-2 pt-2 pb-12 sm:px-4 sm:pb-16", className)}>
        <div className="grain relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-brand-soft px-4 pt-12 pb-14 ring-1 ring-brand-primary/10 ring-inset sm:rounded-[40px] sm:px-8 sm:pt-16 sm:pb-20">
          <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[70%] -translate-x-1/2 rounded-full bg-white/70 blur-[90px]" />
          {["top-[14%] left-[12%] size-5", "top-[38%] right-[10%] size-6", "bottom-[16%] left-[20%] size-4", "bottom-[24%] right-[24%] size-3"].map((pos) => (
            <span key={pos} aria-hidden className={cn("absolute animate-float text-brand-primary/40", pos)}>
              <DoodleSparkle className="size-full" />
            </span>
          ))}
          {content}
        </div>
      </section>
    );
  }

  return <section className={cn("w-full pt-6 pb-12 sm:pt-12 sm:pb-16", GUTTER, className)}>{content}</section>;
}
