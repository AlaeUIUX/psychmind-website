"use client";

import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import type { createShore, SHORE_DEFAULTS } from "@/components/home/globe-scene/shore";

// The blog index's foot, after theboringblog.ai's meadow, in the hero boat's world
// (home/globe-scene/shore.js): dunes seen from eye level, the lighthouse on its headland
// at the far left, the sea only at the far right, and the girl on a dune, all drawn live
// as the hero is (clay in dots, the sand and sea as its water, the grass in two inks).
//
// It sticks to the bottom of the screen while the list scrolls under it (the sand and sea
// take the clicks there, so a post half under them can't be opened by mistake; above
// them, the lighthouse and sky included, the posts stay clickable), and settles at the
// list's end. Kept light: the scene loads after the page and builds in slices (never
// holding up scrolling), runs only while on screen (only the girl moves, 30 frames a
// second), and with reduced motion it's one still frame. Without WebGL it's a band of sand.

type Scene = Awaited<ReturnType<typeof createShore>>;
export type ShoreSettings = typeof SHORE_DEFAULTS;
const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** The land (sand and sea) as a clip-path, from the scene's skyline. */
const landClip = (scene: Scene) =>
  `polygon(${scene
    .skyline()
    .map(([x, y]: number[]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`)
    .join(", ")}, 100% 100%, 0% 100%)`;

/** `tune`: settings over the scene's own, applied as they change (/dev/shore passes
 *  them; the blog doesn't). `className` replaces the blog's sticky band (the tuner's
 *  previews size it themselves). */
export function ShoreScene({ tune, className }: { tune?: Partial<ShoreSettings>; className?: string } = {}) {
  const box = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const landRef = useRef<HTMLDivElement>(null);
  const tuneRef = useRef(tune);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    let disposed = false;
    let cleanup = () => {};

    const load = async () => {
      const { createShore } = await import("@/components/home/globe-scene/shore");
      if (disposed) return;
      const scene: Scene = await createShore(canvas, { tune: tuneRef.current });
      if (disposed) {
        scene.dispose();
        return;
      }
      sceneRef.current = scene;
      const moving = window.matchMedia(MOTION_OK);
      let onScreen = false;
      const play = () => {
        if (!moving.matches) scene.still();
        else if (onScreen) scene.start();
        else scene.stop();
      };
      const land = () => {
        if (landRef.current) landRef.current.style.clipPath = landClip(scene);
      };
      const sizer = new ResizeObserver(() => {
        scene.resize();
        land();
        if (!moving.matches) scene.still();
      });
      sizer.observe(el);
      const watcher = new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        play();
      });
      watcher.observe(canvas);
      moving.addEventListener("change", play);
      scene.resize();
      land();
      scene.still();
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
    load().catch(() => {});
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    tuneRef.current = tune;
    const scene = sceneRef.current;
    if (!tune || !scene) return;
    scene.tune(tune);
    if (landRef.current) landRef.current.style.clipPath = landClip(scene);
  }, [tune]);

  return (
    <div
      ref={box}
      aria-hidden
      className={cn(
        className ?? "pointer-events-none sticky bottom-0 z-10 aspect-[1512/840] max-h-[320px] w-full md:aspect-[4/1] md:max-h-[420px]",
      )}
    >
      {/* without WebGL (or until it's drawn): a band of sand along the foot */}
      <div
        className={`absolute inset-0 bg-linear-to-b from-transparent from-55% to-[#E5DDCF] to-80% transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      {/* the land takes the clicks (its shape set from the scene), the sky lets them through */}
      <div ref={landRef} className="pointer-events-auto absolute inset-0 [clip-path:inset(100%_0_0_0)]" />
      {/* pixelated: the dots are drawn one per device pixel */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 block size-full [image-rendering:pixelated] transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
