import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShoreTuner } from "./shore-tuner";

export const metadata: Metadata = { title: "Shore — PsychMind", robots: { index: false } };

// The blog's shore, tuned live: the dune, the shoreline and beach, the water and its foam,
// the sand's markings, the lighthouse, the girl and the camera, at desktop and phone sizes.
// Hidden on the production site.
export default function DevShorePage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <ShoreTuner />;
}
