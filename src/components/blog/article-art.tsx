import { cn } from "cn";
import { DoodleMagnifier } from "@/components/ui/doodles";

// The article's lead illustration, set on a soft blush panel. Raster images
// are shown at most at their own size so small artwork never gets blown up
// and softened; `art: magnifier` posts use the vector doodle instead.
export function ArticleArt({ image, art, className }: { image?: string; art?: string; className?: string }) {
  if (!image && !art) return null;
  return (
    <div
      className={cn(
        "grain relative flex w-full items-center justify-center overflow-hidden rounded-card bg-blush-25 p-6 ring-1 ring-black/[0.04] ring-inset sm:p-10",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-[60%] -translate-1/2 rounded-full bg-white blur-[90px]" />
      {art === "magnifier" ? (
        <DoodleMagnifier className="relative size-[220px] animate-float text-warm-800 sm:size-[340px]" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="relative h-auto max-h-[460px] w-auto max-w-full object-contain" />
      )}
    </div>
  );
}
