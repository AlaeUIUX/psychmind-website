import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitchenSink } from "./kitchen-sink";

export const metadata: Metadata = { title: "UI kit — PsychMind", robots: { index: false } };

// Every app primitive in every state, for building and reviewing the app's
// design system. Hidden on the production site.
export default function DevUiPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <KitchenSink />;
}
