"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GUTTER } from "@/components/ui/section";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
  { href: "/mission", label: "Mission" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Transparent at the top of the page; frosted with a hairline once content
  // scrolls underneath it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        GUTTER,
        scrolled || open
          ? "border-warm-200/80 bg-warm-25/85 backdrop-blur-md backdrop-saturate-150"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1052px] items-center justify-between sm:h-[72px]">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img src="/images/home/logo.svg" alt="" width={32} height={32} />
          <span className="font-display text-xl text-warm-900">PsychMind</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "rounded-pill px-3 py-2 text-sm font-medium transition-colors duration-200",
                isActive(link.href)
                  ? "bg-warm-100 text-text-primary"
                  : "text-text-secondary hover:bg-warm-100/70 hover:text-text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 flex size-11 items-center justify-center rounded-pill transition-colors hover:bg-warm-100 sm:hidden"
        >
          <span className="relative block h-3 w-4">
            <span
              className={cn(
                "absolute left-0 h-[1.5px] w-full rounded-full bg-text-primary transition-[top,rotate] duration-300 ease-out-soft",
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 h-[1.5px] w-full rounded-full bg-text-primary transition-[top,rotate] duration-300 ease-out-soft",
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[calc(100%-1.5px)]",
              )}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          "absolute top-full right-4 left-4 z-50 flex origin-top flex-col gap-1 rounded-card border border-warm-200 bg-white p-3 shadow-raised transition-[opacity,scale,translate,visibility] duration-300 ease-out-soft sm:hidden",
          open ? "visible translate-y-2 scale-100 opacity-100" : "invisible translate-y-0 scale-[0.98] opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              tabIndex={open ? undefined : -1}
              aria-current={isActive(link.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={cn(
                "flex h-12 items-center rounded-field px-3 type-body font-medium transition-colors",
                isActive(link.href)
                  ? "bg-warm-100 text-text-primary"
                  : "text-text-secondary hover:bg-warm-100 hover:text-text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-warm-200 pt-3">
          <Button asChild variant="secondary" size="md">
            <Link href="/login" tabIndex={open ? undefined : -1} onClick={() => setOpen(false)}>
              Log in
            </Link>
          </Button>
          <Button asChild size="md">
            <Link href="/signup" tabIndex={open ? undefined : -1} onClick={() => setOpen(false)}>
              Create account
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
