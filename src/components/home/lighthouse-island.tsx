"use client";

import { useEffect, useRef, useState } from "react";
import type { createLighthouse } from "./globe-scene/lighthouse";
import { LighthouseSketch } from "./lighthouse-sketch";

// The provider band's picture: the girl standing on a little island under a
// turning lighthouse, in 3D and in the globe's dot print (globe-scene/
// lighthouse.js). Kept light: the scene's code isn't fetched until the band is
// about half a screen away, it only runs while on screen, and with reduced
// motion it's one still frame. Until it's drawn (and without WebGL or script)
// the pencil sketch of the same scene stands in.

type Scene = ReturnType<typeof createLighthouse>;
const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export function LighthouseIsland({ className }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    let disposed = false;
    let cleanup = () => {};

    const load = async () => {
      const { createLighthouse } = await import("./globe-scene/lighthouse");
      if (disposed) return;
      const scene: Scene = createLighthouse(canvas);
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
      sizer.observe(el); // the box: the canvas takes its size from it (whole device pixels)
      const watcher = new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        play();
      });
      watcher.observe(canvas);
      moving.addEventListener("change", play);
      scene.resize();
      play();
      setReady(true);
      cleanup = () => {
        sizer.disconnect();
        watcher.disconnect();
        moving.removeEventListener("change", play);
        scene.dispose();
      };
    };

    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near.disconnect();
        load().catch(() => {});
      },
      { rootMargin: "50% 0px" },
    );
    near.observe(el);
    return () => {
      disposed = true;
      near.disconnect();
      cleanup();
    };
  }, []);

  return (
    <div
      ref={box}
      aria-hidden
      className={`relative aspect-[4/3] ${className ?? ""}`}
    >
      <LighthouseSketch
        className={`absolute inset-0 size-full transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      {/* pixelated: the dots are drawn one per device pixel, and the smooth scroll lands the
          canvas between pixels, so letting the browser blend it would soften and sharpen the
          dots frame by frame (a flicker); drawn pixel for pixel they stay crisp and just move */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 block size-full [image-rendering:pixelated] transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
