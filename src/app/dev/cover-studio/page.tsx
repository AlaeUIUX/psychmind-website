import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoverStudio } from "./studio";

export const metadata: Metadata = { title: "Cover studio — PsychMind", robots: { index: false } };

// Where the blog covers' pictures of the girl are drawn (scenes.js) before
// scripts/render-covers.mjs saves them. Hidden on the production site.
export default function DevCoverStudioPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <CoverStudio />;
}
