"use client";

import { cn } from "cn";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "lenis/dist/lenis.css";

// A blog post, read as theboringblog.ai's are: the page snaps from one part to the
// next (each part a screen tall at least, a longer one scrolling freely inside it;
// the snap is in globals.css, html.reader-snap and .reader-beat), under the site's
// header in the blog's variant (Go back, Subscribe, the menu), with a rail of the
// parts down the left on desktop that shows where you are and takes you to any of them.
//
// How it moves (owner, 2026-11-10: the native snap felt fast and erratic on a mouse
// wheel, then a hand-made glide needed too much scrolling and didn't feel springy):
// - Mouse, trackpad and keys: the landing's smooth scroll (Lenis) with its snap in
//   "lock" mode. A wheel nudge moves the page a little, fluidly; the moment it rests
//   the page springs on to the next part (slightly underdamped, about a second), and
//   input is held until it lands. A part taller than the screen also stops at its end.
// - Touch screens: the browser's own snap, the phone's scroll physics (on iOS,
//   UIKit's paging), one part per flick.
// - Reduced motion: the browser's snap too, without the glide.

export type ReaderPart = { id: string; name: string };

/** A damped spring as an easing over the glide's duration: ζ 0.8, a touch of overshoot. */
const ZETA = 0.8;
const OMEGA = 10;
const springEase = (t: number) => {
  if (t >= 1) return 1;
  const s = t * GLIDE;
  const wd = OMEGA * Math.sqrt(1 - ZETA * ZETA);
  return 1 - Math.exp(-ZETA * OMEGA * s) * (Math.cos(wd * s) + ((ZETA * OMEGA) / wd) * Math.sin(wd * s));
};
/** Seconds a glide takes, and the wheel's quiet (ms) before the next can start. */
const GLIDE = 1.05;
const QUIET = 220;

type Glide = { to: (id: string) => void };

export function Reader({ parts, children }: { parts: ReaderPart[]; children: ReactNode }) {
  const [active, setActive] = useState(parts[0]?.id);
  const glide = useRef<Glide | null>(null);

  useEffect(() => {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    if (touch || still) {
      // the page's own snap, for as long as the post is open
      html.classList.add("reader-snap");
      return () => html.classList.remove("reader-snap");
    }
    const beats = parts.map((p) => document.getElementById(p.id)).filter((el): el is HTMLElement => !!el);
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const [{ default: Lenis }, { default: Snap }] = await Promise.all([import("lenis"), import("lenis/snap")]);
      if (disposed) return;
      const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.8, autoRaf: true });
      // one gesture, one part: once a glide starts, snapping waits until it has landed
      // and the wheel (or a trackpad's coasting) has been quiet for a moment
      let lastWheel = 0;
      let waiting = 0;
      const onWheel = () => {
        lastWheel = performance.now();
      };
      const resume = () => {
        if (performance.now() - lastWheel < QUIET) {
          waiting = window.setTimeout(resume, 60);
          return;
        }
        snap.start();
      };
      const snap = new Snap(lenis, {
        type: "lock",
        duration: GLIDE,
        easing: springEase,
        debounce: 70,
        distanceThreshold: "200%",
        onSnapStart: () => snap.stop(),
        onSnapComplete: () => {
          clearTimeout(waiting);
          waiting = window.setTimeout(resume, 60);
        },
      });
      window.addEventListener("wheel", onWheel, { passive: true });
      // each part's top, and the end of any part taller than the screen
      const removers = beats.map((b) =>
        snap.addElement(b, { align: b.offsetHeight > window.innerHeight + 8 ? ["start", "end"] : ["start"] }),
      );
      const onKey = (e: KeyboardEvent) => {
        const field = (e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]");
        if (field || e.metaKey || e.ctrlKey || e.altKey) return;
        const down = ["ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey);
        const up = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
        if (!down && !up) return;
        e.preventDefault();
        if (down) snap.next();
        else snap.previous();
      };
      window.addEventListener("keydown", onKey);
      glide.current = {
        to: (id) => {
          const el = document.getElementById(id);
          if (el) lenis.scrollTo(el, { duration: GLIDE, easing: springEase, lock: true });
        },
      };
      cleanup = () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("wheel", onWheel);
        clearTimeout(waiting);
        removers.forEach((r) => r());
        snap.destroy();
        lenis.destroy();
        glide.current = null;
      };
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [parts]);

  // where you are: the last part whose top has passed two fifths of the screen
  useEffect(() => {
    const beats = parts.map((p) => document.getElementById(p.id)).filter((el): el is HTMLElement => !!el);
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let current = beats[0];
      for (const el of beats) if (el.getBoundingClientRect().top <= line) current = el;
      if (current) setActive(current.id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [parts]);

  const go = (id: string) => {
    if (glide.current) return glide.current.to(id);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: still ? "auto" : "smooth" });
  };

  return (
    <>
      {/* the site's header in the blog's variant (Go back, Subscribe, the menu), pinned
          over the page; a fade of the paper under it so the text passes under softly */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24 bg-linear-to-b from-warm-25 via-warm-25/85 to-transparent" />
      <SiteHeader variant="blog" fixed />

      {/* the parts, down the left on desktop */}
      <nav aria-label="Parts of this post" className="fixed top-1/2 left-6 z-20 hidden -translate-y-1/2 xl:block">
        <ol className="flex flex-col gap-1">
          {parts.map((p) => {
            const current = p.id === active;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => go(p.id)}
                  aria-current={current ? "step" : undefined}
                  className="group flex items-center gap-3 py-1 text-left"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-px transition-[width,background-color] duration-300 ease-out-soft",
                      current ? "w-6 bg-brand-primary" : "w-4 bg-warm-400 group-hover:w-5 group-hover:bg-warm-600",
                    )}
                  />
                  <span
                    className={cn(
                      "type-small max-w-[200px] truncate transition-colors duration-300",
                      current ? "text-text-primary" : "text-text-placeholder group-hover:text-text-secondary",
                    )}
                  >
                    {p.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {children}
    </>
  );
}

/** One part: at least a screen tall, a snap point at its top. */
export function Beat({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("reader-beat relative min-h-svh px-6 pt-28 pb-32", className)}>
      <div className="mx-auto w-full max-w-[600px]">{children}</div>
    </section>
  );
}
