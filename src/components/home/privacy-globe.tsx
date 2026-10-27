"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { statusChip, statusPill } from "@/components/ui/section-badge";
import { LockGlyph } from "./bento-previews";
import type { createGlobeScene, GLOBE_DEFAULTS } from "./globe-scene/scene";

// The privacy promise's picture: the girl's boat in the middle, on top of a big
// planet of the hero's water and islands (globe-scene/scene.js), with its line in
// a pill like the section eyebrows, behind a padlock that shuts as it comes up.
//
// Kept light: the scene's code isn't fetched until the picture is about half a
// screen away, it only runs while on screen (30 frames a second on phones), and
// with reduced motion it's one still frame (a drag still turns it). Without
// WebGL the picture is the pill on the grey.

type Scene = ReturnType<typeof createGlobeScene>;
export type GlobeSettings = typeof GLOBE_DEFAULTS;

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
// TODO(client): new copy, the owner's line (2026-10-27), in its two halves (it
// breaks between them on phones, where one line is wider than the picture).
const LINE = ["We never know what", "she’s carrying around."];

/** `tune`: settings over the globe's own, applied as they change (the tuning page,
 *  /dev/globe, passes them; the home page doesn't). */
export function PrivacyGlobe({ tune }: { tune?: Partial<GlobeSettings> } = {}) {
  const box = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const tuneRef = useRef(tune);
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState(false);
  const [shut, setShut] = useState(false);

  useEffect(() => {
    const el = box.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    let disposed = false;
    let cleanup = () => {};
    let shutting = 0;

    const load = async () => {
      const { createGlobeScene } = await import("./globe-scene/scene");
      if (disposed) return;
      const scene: Scene = createGlobeScene(canvas, { maxPixelRatio: 2, tune: tuneRef.current });
      sceneRef.current = scene;
      const moving = window.matchMedia(MOTION_OK);
      let onScreen = false;

      const play = () => {
        if (!moving.matches) scene.still();
        else if (onScreen) scene.start();
        else scene.stop();
      };
      const sizer = new ResizeObserver(() => {
        scene.resize();
        if (!moving.matches) scene.still();
      });
      sizer.observe(canvas);
      const watcher = new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        play();
      });
      watcher.observe(canvas);
      moving.addEventListener("change", play);
      scene.resize(); // the first frame is drawn before the canvas fades in
      play();
      setReady(true);

      cleanup = () => {
        sizer.disconnect();
        watcher.disconnect();
        moving.removeEventListener("change", play);
        sceneRef.current = null;
        scene.dispose();
      };
    };

    // nothing loads until the picture is about half a screen away
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near.disconnect();
        load().catch(() => {});
      },
      { rootMargin: "50% 0px" },
    );
    near.observe(el);
    // the pill comes up once the picture is well in view, and its lock shuts after
    // (straight away with reduced motion)
    const inView = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.intersectionRatio >= 0.5)) return;
        inView.disconnect();
        setSeen(true);
        shutting = window.setTimeout(() => setShut(true), window.matchMedia(MOTION_OK).matches ? 700 : 0);
      },
      { threshold: 0.5 },
    );
    inView.observe(el);

    return () => {
      disposed = true;
      window.clearTimeout(shutting);
      near.disconnect();
      inView.disconnect();
      cleanup();
    };
  }, []);

  useEffect(() => {
    tuneRef.current = tune;
    if (tune) sceneRef.current?.tune(tune);
  }, [tune]);

  return (
    <div ref={box} className="absolute inset-0">
      {/* the planet runs off the foot, fading into the grey under the pill */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`block size-full cursor-grab touch-pan-y transition-opacity duration-1000 ease-out [mask-image:linear-gradient(to_bottom,black_70%,transparent)] active:cursor-grabbing motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-[13%] flex justify-center px-3">
        <p
          className={cn(
            statusPill,
            "inline-flex items-center gap-2 pr-3 pl-1 transition duration-500 ease-out motion-reduce:transition-none max-sm:h-auto max-sm:py-1 max-sm:leading-snug",
            seen ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          )}
        >
          <span className={cn(statusChip, "bg-warm-200")}>
            <LockGlyph shut={shut} className="size-3.5" />
          </span>
          <span>
            {LINE[0]}
            <br className="sm:hidden" /> {LINE[1]}
          </span>
        </p>
      </div>
    </div>
  );
}
