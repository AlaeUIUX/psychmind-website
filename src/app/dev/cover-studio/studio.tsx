"use client";

import { useEffect, useRef } from "react";
import { COVER_SCENES, renderCover } from "./scenes";

// Each of the girl's cover pictures drawn once into a 1280 × 720 canvas, shown at
// half size on the cover's paper. scripts/render-covers.mjs reads the canvases
// (data-cover) and saves them to public/images/blog/covers.

const NAMES = Object.keys(COVER_SCENES) as (keyof typeof COVER_SCENES)[];

function Picture({ name }: { name: keyof typeof COVER_SCENES }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    renderCover(canvas.current, name);
    canvas.current.dataset.ready = "true";
  }, [name]);
  return (
    <figure className="flex flex-col gap-2">
      <canvas
        ref={canvas}
        data-cover={name}
        width={1280}
        height={720}
        className="w-[640px] rounded-card"
        style={{ background: "color-mix(in oklab, var(--color-warm-100), var(--color-brand-primary) 1.5%)" }}
      />
      <figcaption className="type-caption text-text-placeholder">{name}</figcaption>
    </figure>
  );
}

export function CoverStudio() {
  return (
    <main className="flex flex-col gap-10 px-6 py-12">
      <header className="max-w-[640px]">
        <h1 className="type-display">Cover studio</h1>
        <p className="type-body mt-2 text-text-tertiary">
          The girl&apos;s cover pictures in the landing&apos;s dot print. Save them with{" "}
          <code>node scripts/render-covers.mjs</code> while the dev server runs.
        </p>
      </header>
      {NAMES.map((name) => (
        <Picture key={name} name={name} />
      ))}
    </main>
  );
}
