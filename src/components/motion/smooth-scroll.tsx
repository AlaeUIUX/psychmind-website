"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

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
    };
  }, []);

  // New page: jump to the top immediately (Lenis would otherwise glide there)
  // and let triggers re-measure against the new layout.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    const t = setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
