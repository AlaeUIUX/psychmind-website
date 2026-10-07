import type { SVGProps } from "react";

// Hand-drawn pencil marks in the same loose line style as the site's
// illustrations. Every stroke carries `data-draw`, so a parent animation can
// "draw" it in with DrawSVG; without JS they're simply visible.
// Paths are deliberately a little wobbly and overshoot, like a real pen.

type DoodleProps = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function base(props: DoodleProps) {
  return { "aria-hidden": true, focusable: false, ...props } as const;
}

/** A loose curved arrow pointing right. Rotate/flip it for other directions. */
export function DoodleArrow(props: DoodleProps) {
  return (
    <svg viewBox="0 0 120 48" {...base(props)}>
      <path data-draw d="M4 34C22 16 46 8 70 12C86 15 99 22 110 30" {...stroke} />
      <path data-draw d="M97 20C103 24 107 27 111 31C105 33 100 36 95 40" {...stroke} />
    </svg>
  );
}

/** A tighter hooked arrow that turns a corner (for going down / around). */
export function DoodleHookArrow(props: DoodleProps) {
  return (
    <svg viewBox="0 0 64 96" {...base(props)}>
      <path data-draw d="M10 6C34 8 54 24 52 48C51 64 42 78 30 88" {...stroke} />
      <path data-draw d="M26 76C27 81 28 85 30 89C35 87 40 85 45 84" {...stroke} />
    </svg>
  );
}

/** A scribbled ring drawn around something — overshoots where it closes. */
export function DoodleCircle(props: DoodleProps) {
  return (
    <svg viewBox="0 0 160 80" preserveAspectRatio="none" {...base(props)}>
      <path
        data-draw
        d="M96 7C58 2 14 12 8 38C3 60 42 76 88 73C132 70 156 55 152 34C148 13 112 4 78 8C60 10 44 14 32 20"
        {...stroke}
      />
    </svg>
  );
}

/** A single hand-drawn underline swoosh. */
export function DoodleUnderline(props: DoodleProps) {
  return (
    <svg viewBox="0 0 240 16" preserveAspectRatio="none" {...base(props)}>
      <path data-draw d="M3 11C45 5 92 4 138 6C170 7 204 9 237 5" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}

/** A quick tick mark. */
export function DoodleCheck(props: DoodleProps) {
  return (
    <svg viewBox="0 0 28 24" {...base(props)}>
      <path data-draw d="M3 13C6 15 9 18 11 21C15 13 20 7 25 3" {...stroke} strokeWidth={2} />
    </svg>
  );
}

/** Four-point sparkle, like the ones scattered through the illustrations. */
export function DoodleSparkle(props: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path data-draw d="M12 2C12.6 8 14 10 21 12C14 13.4 12.6 15.6 12 22C11.4 15.6 10 13.4 3 12C10 10.6 11.4 8 12 2Z" {...stroke} />
    </svg>
  );
}

/**
 * A hand-held magnifying glass — the "search" mark, redrawn as vector so it
 * stays crisp at any size (the original PNG was only 319px). The glass is a
 * separate filled shape (`data-glass`) so it can fade in after the outline
 * draws; `data-glint` marks the shine lines.
 */
export function DoodleMagnifier(props: DoodleProps) {
  return (
    <svg viewBox="0 0 220 220" {...base(props)}>
      <ellipse data-glass cx="130" cy="78" rx="34" ry="42" transform="rotate(20 130 78)" fill="#EAF1F6" />
      <path
        data-glint
        d="M112 58C115 49 121 43 129 40"
        {...stroke}
        stroke="white"
        strokeWidth={5}
        opacity={0.9}
      />
      <ellipse data-draw cx="130" cy="78" rx="40" ry="48" transform="rotate(20 130 78)" {...stroke} />
      <ellipse data-draw cx="130" cy="78" rx="34" ry="42" transform="rotate(20 130 78)" {...stroke} strokeWidth={1.2} />
      <path data-draw d="M105.7 123.6L102.7 131.9L115.9 136.7L118.9 128.4Z" {...stroke} />
      <path data-draw d="M104.6 126.7L117.6 131.4M103.6 129.4L116.8 134.2" {...stroke} strokeWidth={1} />
      <path data-draw d="M103.4 135L81.4 192C80 197.5 87 202 91.5 197.5L114.6 139" {...stroke} />
      <path data-draw d="M64 40C64.5 47 66 49 72 50C66 51.5 64.5 53.5 64 60C63.5 53.5 62 51.5 56 50C62 49 63.5 47 64 40Z" {...stroke} strokeWidth={1.3} />
      <circle data-draw cx="76" cy="84" r="3" {...stroke} strokeWidth={1.2} />
      <path data-draw d="M178 98L186 94M182 114L191 116M170 128L174 137" {...stroke} strokeWidth={1.3} />
    </svg>
  );
}
