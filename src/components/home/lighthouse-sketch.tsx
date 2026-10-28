"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// The provider band's picture: a pencil sketch, in the doodles' loose line
// (ui/doodles.tsx), of a lighthouse on a little island with the girl leaning on
// it, in the search button's red, her hair in its bun, as on the boat. Its
// light reaches out both ways: the provider as a light for the people looking.
// The lines draw themselves in as the band comes into view, then her dress
// fills; reduced motion (and no script) shows it drawn.

const ink = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LighthouseSketch({ className }: { className?: string }) {
  const root = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top 75%",
            once: true,
          },
        });
        tl.from(q("[data-draw]"), {
          drawSVG: 0,
          duration: 0.8,
          ease: "power2.inOut",
          stagger: 0.05,
        });
        tl.from(q("[data-fill]"), { opacity: 0, duration: 0.5 }, "-=0.3");
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <svg
      ref={root}
      viewBox="0 0 480 340"
      aria-hidden
      focusable={false}
      className={className}
    >
      <g className="text-warm-700">
        {/* the sea round the island */}
        <path
          data-draw
          {...ink}
          d="M28 292C48 286 64 286 82 292M392 292C410 286 428 286 448 292"
        />
        <path
          data-draw
          {...ink}
          strokeWidth={1.3}
          d="M60 312C74 307 86 307 100 312M150 318C166 313 180 313 196 318M290 316C306 311 320 311 336 316M380 310C392 306 402 306 414 310"
        />
        {/* the island */}
        <path
          data-draw
          {...ink}
          d="M86 292C120 262 170 252 236 250C306 249 356 262 392 292"
        />
        <path
          data-draw
          {...ink}
          strokeWidth={1.2}
          d="M128 276C140 272 150 272 160 276M322 274C334 270 344 270 354 274"
        />
        {/* a tuft of grass */}
        <path
          data-draw
          {...ink}
          strokeWidth={1.2}
          d="M150 262L146 250M154 262L156 248M158 262L164 252"
        />

        {/* the lighthouse: a tapering tower in bands, its gallery, the lantern room and its cap */}
        <path data-draw {...ink} d="M206 252L216 118M262 252L252 118" />
        <path
          data-draw
          {...ink}
          strokeWidth={1.3}
          d="M209 214C226 218 242 218 259 214M212 176C226 180 242 180 256 176M214 146C228 149 240 149 254 146"
        />
        <path data-draw {...ink} d="M226 252V232C226 224 242 224 242 232V252" />
        <path data-draw {...ink} strokeWidth={1.3} d="M232 196V188H238V196Z" />
        <path data-draw {...ink} d="M206 118H262M208 118V110H260V118" />
        <path
          data-draw
          {...ink}
          d="M218 110V84H250V110M226 110V84M242 110V84"
        />
        <path data-draw {...ink} d="M213 84H255L234 62L213 84ZM234 62V54" />
        {/* its light, reaching out both ways */}
        <path
          data-draw
          {...ink}
          strokeWidth={1.3}
          d="M214 92L150 74M214 102L148 112M254 92L322 74M254 102L324 112"
        />

        <g transform="translate(7 0)">
          {/* the girl, her back against the tower, her feet out on the island */}
          <path
            data-draw
            {...ink}
            strokeWidth={1.4}
            d="M276 232L290 250M282 232L298 249"
          />
          <path
            data-draw
            {...ink}
            strokeWidth={1.4}
            d="M286 251H294M294 250H302"
          />
          <path
            data-fill
            d="M262 194L290 232L268 236Z"
            className="fill-brand-primary"
          />
          <path
            data-draw
            {...ink}
            strokeWidth={1.4}
            d="M262 194L290 232L268 236Z"
          />
          <circle
            data-draw
            {...ink}
            strokeWidth={1.4}
            cx="265"
            cy="184"
            r="8"
          />
          <path
            data-fill
            d="M257 182C257 172 271 171 273 180C268 176 262 177 257 182Z"
            className="fill-warm-900"
          />
          <circle data-fill cx="259" cy="175" r="4" className="fill-warm-900" />
          {/* one hand on the wall behind her, the other on her hip */}
          <path
            data-draw
            {...ink}
            strokeWidth={1.4}
            d="M265 200L257 212M270 206L279 214L274 220"
          />
        </g>

        {/* gulls */}
        <path
          data-draw
          {...ink}
          strokeWidth={1.3}
          d="M96 46C101 40 106 40 110 46C114 40 119 40 124 46M366 34C370 30 374 30 377 34C380 30 384 30 388 34"
        />
        {/* a sparkle on the sea */}
        <path
          data-draw
          {...ink}
          strokeWidth={1.2}
          d="M420 252V264M414 258H426"
        />
      </g>
    </svg>
  );
}
