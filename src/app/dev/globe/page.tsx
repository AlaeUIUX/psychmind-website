import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlobeTuner } from "./globe-tuner";

export const metadata: Metadata = { title: "Globe — PsychMind", robots: { index: false } };

// The privacy globe, tuned live: the boat's print, light, size and ride, the
// planet, its islands, their surf and the waves, on the card's picture at desktop
// and phone sizes. Hidden on the production site.
export default function DevGlobePage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <GlobeTuner />;
}
