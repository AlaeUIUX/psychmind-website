"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
  { href: "/mission", label: "Mission" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full flex justify-center px-4 sm:px-8 py-6 relative">
      <div className="flex w-full max-w-[920px] items-center justify-between p-1">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img src="/images/home/logo.svg" alt="PsychMind" width={32} height={32} />
          <span className="font-display text-warm-900 text-xl">PsychMind</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-pill px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-warm-100 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-pill bg-warm-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-warm-900 transition-colors"
          >
            Create account
          </Link>
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden flex items-center justify-center size-8"
        >
          {open ? (
            <span className="relative block size-4">
              <span className="absolute inset-0 rotate-45 top-1/2 h-px w-full bg-text-primary" />
              <span className="absolute inset-0 -rotate-45 top-1/2 h-px w-full bg-text-primary" />
            </span>
          ) : (
            <img src="/images/home/menu-icon.svg" alt="" width={16} height={16} />
          )}
        </button>
      </div>

      {open && (
        <div className="sm:hidden absolute top-full left-0 right-0 z-50 mx-4 rounded-2xl border border-warm-300 bg-white shadow-lg flex flex-col gap-1 p-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-md font-medium text-text-secondary hover:bg-warm-100 hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-warm-200 pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-pill px-3 py-2 text-center text-sm font-semibold text-text-primary hover:bg-warm-100 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-pill bg-warm-800 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-warm-900 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
