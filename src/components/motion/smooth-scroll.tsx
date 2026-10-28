"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { takeKeptScroll } from "@/lib/dev-reload";
import { gsap, ScrollTrigger } from "@/lib/gsap";

// The running Lenis, for code that needs to scroll the page itself (it would fight a
// native smooth scroll). Null with reduced motion, and off the marketing site.
let current: Lenis | null = null;
export const getLenis = () => current;

// Inertial smooth scrolling for the marketing site, driven by GSAP's ticker so
// Lenis and every ScrollTrigger read the same frame. Touch devices keep native
// scrolling (Lenis default), and reduced-motion users get plain scrolling.
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -96 }, autoRaf: false });
    lenisRef.current = lenis;
    current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Fonts change line lengths (and so trigger positions) once they land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      current = null;
    };
  }, []);

  // New page: jump to the top immediately (Lenis would otherwise glide there)
  // and let triggers re-measure against the new layout. After a scene's reload in
  // development (lib/dev-reload.ts), back to where the page was instead.
  useEffect(() => {
    const kept = process.env.NODE_ENV === "development" ? takeKeptScroll() : null;
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    const t = setTimeout(() => {
      ScrollTrigger.refresh();
      if (kept !== null) {
        if (lenisRef.current) lenisRef.current.scrollTo(kept, { immediate: true, force: true });
        else window.scrollTo(0, kept);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
