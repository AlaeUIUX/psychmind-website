import { cn } from "cn";
import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
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
  className?: string;
};

// The opening of every top-level page: illustration, H1, lede, actions.
// Each line plays in on first paint, one after another, without waiting for
// JS; the illustration then keeps a slow, barely-there float.
export function PageHero({ illustration, eyebrow, title, subtitle, children, className }: PageHeroProps) {
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

  return (
    <section className={cn("w-full pt-6 pb-12 sm:pt-12 sm:pb-16", GUTTER, className)}>
      <Reveal
        trigger="load"
        className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-4 text-center"
      >
        {!illustration?.after && art}
        {eyebrow && <p className="type-lead text-text-secondary">{eyebrow}</p>}
        <h1 className="type-display text-text-primary">{title}</h1>
        {subtitle && <p className="type-lead max-w-[566px] text-text-secondary">{subtitle}</p>}
        {illustration?.after && art}
        {children && <div className="mt-4 flex w-full flex-col items-center gap-3 sm:mt-6">{children}</div>}
      </Reveal>
    </section>
  );
}
