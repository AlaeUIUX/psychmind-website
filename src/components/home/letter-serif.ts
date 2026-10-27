import { Newsreader } from "next/font/google";

// The founders' letter's book serif, close to Interfere's Heldane: self-hosted
// through next/font and loaded only where it's set (the letter and the reviews).
// Put `letterSerif.variable` on the section and set text in
// `font-[family-name:var(--font-letter)]`.
export const letterSerif = Newsreader({ subsets: ["latin"], variable: "--font-letter", preload: false });
