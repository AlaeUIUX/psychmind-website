import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ivarTextHydro = localFont({
  variable: "--font-ivar",
  display: "swap",
  src: [
    { path: "../fonts/IvarTextHydro-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/IvarTextHydro-Italic.ttf", weight: "400", style: "italic" },
    { path: "../fonts/IvarTextHydro-Bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/IvarTextHydro-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
});

// Used only where Figma explicitly calls for the Display cut instead of the
// font-family-display token (e.g. the "Smart search" heading in the feature card).
const ivarDisplayHydro = localFont({
  variable: "--font-ivar-display",
  display: "swap",
  src: [{ path: "../fonts/IvarDisplayHydro-Regular.ttf", weight: "400", style: "normal" }],
});

export const metadata: Metadata = {
  title: "PsychMind — Find the right provider for you",
  description:
    "PsychMind connects you with verified independent mental health providers. No referral needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ivarTextHydro.variable} ${ivarDisplayHydro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-warm-25 text-text-primary font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
