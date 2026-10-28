import type { CSSProperties } from "react";
import { SampleProfile } from "./sample-profile";

// Under the How it works hero, after devin.ai's: the experience in the middle (for
// now the sample profile; the provider dashboard once it's built), and behind it a
// collage of frames drifting left to right across the page's full width. Every frame
// is the same: one size, one shape, a plain grey placeholder (the pictures come
// later). They differ only in depth: three layers, the nearer sharp and quicker, the
// further more blurred, fainter and slower. Each layer has four lanes; a lane's
// frames share its pace, spaced evenly round it, so they never bunch up. It's CSS
// only (the hero-collage-pan keyframes in globals.css), and with reduced motion the
// frames hold still where they are.

/** The one frame, in CSS px (4:3), before the phone and tablet scale. */
const FRAME = { w: 160, h: 120 };

// far to near: how blurred and faint, and how long each lane takes to cross (s)
const LAYERS = [
  { blur: 6, opacity: 0.6, seconds: [121, 161, 202, 242] },
  { blur: 3, opacity: 0.8, seconds: [88, 117, 146, 176] },
  { blur: 0, opacity: 1, seconds: [55, 73, 92, 110] },
];
const PER_LANE = 3;

// a seeded random, so the server and the browser lay the collage out the same
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const layers = LAYERS.map((layer, l) => {
  const rng = seeded(11 + l * 7);
  return {
    ...layer,
    frames: layer.seconds.flatMap((seconds, lane) =>
      Array.from({ length: PER_LANE }, (_, k) => ({
        top: rng(), // where in the band's height, as a share of the room left
        seconds,
        // spaced evenly round the lane, nudged a little so lanes don't line up
        delay: -seconds * ((k + rng() * 0.35 + lane * 0.13 + l * 0.21) / PER_LANE),
      })),
    ),
  };
});

function Collage({ blur, opacity, frames }: (typeof layers)[number]) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-[calc(50%-50vw)] w-screen overflow-hidden [--collage-scale:0.6] sm:[--collage-scale:0.85] lg:[--collage-scale:1]"
      style={{ opacity, filter: blur ? `blur(${blur}px)` : undefined }}
    >
      {frames.map((frame, i) => (
        <div
          key={i}
          className="hero-collage-tile absolute -left-[260px] bg-warm-200"
          style={
            {
              width: `calc(${FRAME.w}px * var(--collage-scale))`,
              height: `calc(${FRAME.h}px * var(--collage-scale))`,
              top: `calc(${frame.top.toFixed(4)} * (100% - ${FRAME.h}px * var(--collage-scale)))`,
              animationDuration: `${frame.seconds}s`,
              animationDelay: `${frame.delay.toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function HeroShowcase() {
  return (
    <div className="relative w-full overflow-x-clip px-4 py-12 text-left sm:px-8 sm:py-16 lg:px-12">
      {layers.map((layer, i) => (
        <Collage key={i} {...layer} />
      ))}
      {/* the experience, over the collage */}
      <div className="relative mx-auto w-full max-w-[1052px]">
        <SampleProfile className="shadow-raised" />
      </div>
    </div>
  );
}
