"use client";

import { Inter } from "next/font/google";

// The story's subtitles: plain film-style lines in Inter italic, on the same quiet
// surface as the scene's mute button (white, hairline border, control shadow),
// rounded as a card so one line reads as a pill and two as a soft box. Each line
// fades in; screen readers hear it once, whole.

// Inter's italic cut, only for the subtitles, fetched when the first line shows.
const interItalic = Inter({ subsets: ["latin"], weight: "400", style: "italic", display: "swap", preload: false });

/** The subtitle for the current line (null hides it). */
export function StorySubtitle({ line }: { line: string | null }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[13%] flex justify-center px-6">
      <p aria-live="polite" className="sr-only">
        {line}
      </p>
      {line && (
        <p
          key={line}
          aria-hidden
          className={`${interItalic.className} max-w-xl animate-in rounded-card border border-warm-200 bg-white px-5 py-2.5 text-center text-[17px] leading-snug text-warm-800 italic shadow-control duration-500 fade-in-0 slide-in-from-bottom-1 sm:text-lg`}
        >
          {line}
        </p>
      )}
    </div>
  );
}
