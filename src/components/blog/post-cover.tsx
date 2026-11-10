import { cn } from "cn";
import type { CSSProperties } from "react";
import { COVER_ART, isCoverArt } from "./cover-spots";

// A post's cover, after incident.io's blog (owner, 2026-11-10): the paper and one
// picture of what the post is about, nothing written on it (the post's title, beside
// it, says what it is). Product posts show our own UI or a quiet diagram; human ones
// show the girl, in the landing's dot print (cover-spots.tsx).
//
// It's laid out once on a 640 × 360 stage and scaled to whatever box it's in, as a
// picture would be (`scale` is the box's width over 640, from the container's width),
// so every cover is the same picture at every size, in the home page's grid and at
// the top of a post alike. At its foot the picture fades into the paper and blurs.

/** The landing's grey, with the faintest trace of the search button's red. */
const PAPER = "color-mix(in oklab, var(--color-warm-100), var(--color-brand-primary) 1.5%)";

const box = { containerType: "inline-size", background: PAPER } as CSSProperties;
const stage = { scale: "tan(atan2(100cqw, 640px))" } as CSSProperties;

export function PostCover({ spot, className }: { spot?: string; className?: string }) {
  const Art = COVER_ART[isCoverArt(spot) ? spot : "search"].Art;
  return (
    <div aria-hidden style={box} className={cn("relative aspect-video w-full overflow-hidden", className)}>
      <div style={stage} className="absolute top-0 left-0 h-[360px] w-[640px] origin-top-left font-[family-name:var(--font-inter)]">
        <div className="absolute inset-0 transition-[translate] duration-700 ease-out-soft [mask-image:linear-gradient(to_bottom,#000_215px,transparent_345px)] group-hover:-translate-y-1">
          <Art />
        </div>
        {/* the blend: the picture blurs as it fades into the paper */}
        <div className="absolute inset-x-0 top-[200px] bottom-0 backdrop-blur-[6px] [mask-image:linear-gradient(to_bottom,transparent,#000_90px)]" />
      </div>
    </div>
  );
}
