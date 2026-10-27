"use client";

import { useEffect, useRef, useState } from "react";
import type { createBoatScene } from "@/components/home/boat-scene/scene";

// The footer's sign-off: the hero's voyage again, seen up close and low over
// the water (the angle framed by hand in the sandbox), in the hero's colours,
// under a mist that never turns to rain. It runs the page's width at the foot,
// dissolving into the footer along its top.
//
// Kept light, as it shares the page with the hero's: the scene's code (the
// hero's chunk, so usually already loaded) isn't fetched until the footer is a
// screen away, it only draws while on screen (the hero's stops when it's off
// screen, so the two never run together), it draws at most 1.5× the CSS pixels
// at 30 frames a second (24 on phones), and with reduced motion it's one still
// frame. Without WebGL the footer simply ends without it.

type Scene = ReturnType<typeof createBoatScene>;

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** The sandbox's framing: the hero's bearing, brought down low over the water and close in. */
const VIEW = { polar: 82, azimuth: -62.2, zoom: 2.55 };

export function FooterScene() {
  const box = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    let disposed = false;
    let cleanup = () => {};

    const load = () =>
      import("@/components/home/boat-scene/scene")
        .then(({ createBoatScene }) => {
          if (disposed) return;
          const scene: Scene = createBoatScene(canvas, {
            view: VIEW,
            weather: "mist",
            // a stretch with a tower out ahead on the right, across from the boat
            startAt: 0.14,
            edge: "top",
            boatX: 0.3,
            boatY: 0.72,
            maxPixelRatio: 1.5,
          });
          const moving = window.matchMedia(MOTION_OK);
          let onScreen = false;
          let stilled = false;

          const play = () => {
            if (onScreen && moving.matches) scene.start();
            else scene.stop();
          };
          const resize = () => {
            scene.resize();
            if (!moving.matches && !stilled) {
              scene.still();
              stilled = true;
            }
          };
          const sizer = new ResizeObserver(resize);
          sizer.observe(canvas);
          const watcher = new IntersectionObserver((entries) => {
            onScreen = entries[entries.length - 1].isIntersecting;
            play();
          });
          watcher.observe(canvas);
          const onMotionChange = () => {
            stilled = false;
            resize();
            play();
          };
          moving.addEventListener("change", onMotionChange);
          // a new pixel ratio (browser zoom, another screen) doesn't always resize the canvas
          let ratio: MediaQueryList | null = null;
          const onRatio = () => {
            resize();
            watchRatio();
          };
          const watchRatio = () => {
            ratio?.removeEventListener("change", onRatio);
            ratio = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
            ratio.addEventListener("change", onRatio);
          };
          watchRatio();
          resize(); // the first frame is drawn before the canvas fades in
          setReady(true);

          cleanup = () => {
            sizer.disconnect();
            watcher.disconnect();
            moving.removeEventListener("change", onMotionChange);
            ratio?.removeEventListener("change", onRatio);
            scene.dispose();
          };
        })
        .catch(() => {});

    // nothing loads until the footer is about a screen away
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near.disconnect();
        load();
      },
      { rootMargin: "100% 0px" },
    );
    near.observe(el);

    return () => {
      disposed = true;
      near.disconnect();
      cleanup();
    };
  }, []);

  return (
    <div ref={box} aria-hidden className="relative h-[clamp(260px,36vw,520px)] w-full">
      <canvas
        ref={canvasRef}
        className={`pointer-events-none block size-full transition-opacity duration-1000 ease-out motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
