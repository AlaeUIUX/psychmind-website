"use client";

// Single place GSAP plugins are registered, so every component imports from
// here and never double-registers. Client-only.
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP);

// House easing, matching --ease-out-soft in globals.css.
gsap.defaults({ ease: "power3.out", duration: 0.9 });

/** Media query GSAP animations run under; reduced-motion users get static layouts. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP };
