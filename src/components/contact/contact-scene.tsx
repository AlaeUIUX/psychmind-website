"use client";

import { useEffect, useRef, useState } from "react";
import type { createBoatScene } from "@/components/home/boat-scene/scene";

// The contact page's panel: the home hero's voyage (boat-scene/scene.js), the girl in
// her boat, filling the panel to its edges (no ring of cloud) and only to look at (no
// story, nothing to click). It draws only while on screen, and with reduced motion
// it's one still frame. Without WebGL the panel stays its plain paper.

type Scene = ReturnType<typeof createBoatScene>;

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export function ContactScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    import("@/components/home/boat-scene/scene")
      .then(({ createBoatScene }) => {
        if (disposed) return;
        const scene: Scene = createBoatScene(canvas, { edge: "none", boatX: 0.5, boatY: 0.5 });
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
        resize(); // the first frame is drawn before the canvas fades in
        setReady(true);

        cleanup = () => {
          sizer.disconnect();
          watcher.disconnect();
          moving.removeEventListener("change", onMotionChange);
          scene.dispose();
        };
      })
      .catch(() => {});

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none relative size-full overflow-hidden rounded-panel bg-warm-25">
      <canvas
        ref={canvasRef}
        className={`block size-full transition-opacity duration-1000 ease-out motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
