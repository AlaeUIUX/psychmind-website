"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { AccountMenu, type AppUser } from "@/components/app/account-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLenis } from "@/components/motion/smooth-scroll";

/** sort.to's dropdown row: 32px, 8px sides, 14px on a 20px line, 4px corners. */
const menuItem = "h-8 cursor-pointer rounded-[4px] px-2 py-1.5 text-sm";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
  { href: "/mission", label: "Mission" },
  { href: "/contact", label: "Contact" },
];

/** `account` (signed-in pages such as the directory) swaps Log in / Create
 *  account for the avatar menu, as in Figma's logged-in results (S3). `home` is
 *  where the logo goes: "/" on the marketing site, the marketing site's address
 *  from the directory (on the app host, "/" is the portal's log-in). */
export function SiteHeader({ account, onSignOut, home = "/" }: { account?: AppUser; onSignOut?: () => void; home?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const pathname = usePathname();

  // Transparent at the top of the page; frosted with a hairline once content
  // scrolls underneath it — and inverted while it sits over a dark band
  // (any element marked `data-header-dark`).
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 8);
      const probe = 32;
      setOnDark(
        Array.from(document.querySelectorAll("[data-header-dark]")).some((el) => {
          const r = el.getBoundingClientRect();
          return r.top <= probe && r.bottom >= probe;
        }),
      );
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  const dark = onDark && !open;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // On the homepage the logo is a link to the page you're on, which Next keeps as
  // it is (and the smooth scroll only resets on a new path), so it did nothing.
  // There it glides back to the top instead.
  const goHome = (e: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    if (home !== "/" || pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: no-preference)").matches ? "smooth" : "auto" });
  };

  // Spacing cloned from sort.to's header (64px above a 32px row, 40px below,
  // 976px wide). Theirs scrolls away; ours stays, so the 64px splits into a
  // spacer that scrolls off plus the sticky bar's own 16px, and the 40px into
  // the bar's 16px (15px + its 1px border) plus a 24px margin under it.
  return (
    <>
      <div aria-hidden className="h-12" />
      <header
        className={cn(
          "sticky top-0 z-50 mb-6 w-full border-b pt-4 pb-[15px] font-[family-name:var(--font-inter)] transition-[background-color,border-color,backdrop-filter] duration-500",
          dark
            ? "border-white/10 bg-warm-950/60 backdrop-blur-md"
            : scrolled || open
              ? "border-warm-200/80 bg-warm-25/85 backdrop-blur-md backdrop-saturate-150"
              : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-8 w-full max-w-5xl items-center justify-between px-6">
          {/* sort.to's logo is a 24px-tall row: mark, 8px gap, wordmark. */}
          <Link href={home} className="flex h-6 items-center gap-2 transition-opacity duration-150 hover:opacity-80" onClick={goHome}>
            <img
              src="/images/home/logo.svg"
              alt=""
              width={24}
              height={24}
              className={cn("size-6 transition-[filter] duration-500", dark && "invert")}
            />
            <span className={cn("font-display text-lg leading-6 transition-colors duration-500", dark ? "text-warm-25" : "text-warm-900")}>
              PsychMind
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {account && <AccountMenu user={account} onSignOut={onSignOut} />}

            {/* Placeholder menu until the menu screen is designed, sized like
                sort.to's Apps dropdown (224px, 32px rows of 14px text). */}
            <DropdownMenu open={open} onOpenChange={setOpen}>
              {/* The menu pill from Catalyst Design Lab (see "Menu pill" in
                  globals.css): Log in and Create account (from sm up), then the
                  menu icon, whose two lines meet in the middle and turn into a
                  cross. 44px, so it hangs 6px past the 32px row on each side. */}
              <div data-open={open} data-tone={dark ? "dark" : "light"} className="menu-pill -my-1.5">
                {!account && (
                  <>
                    <Link href="/login" className="menu-pill-link">
                      Log in
                    </Link>
                    <Link href="/signup" className="menu-pill-chip">
                      Create account
                    </Link>
                  </>
                )}
                <DropdownMenuTrigger className="menu-pill-toggle">
                  <svg className="menu-pill-lines" viewBox="0 0 24 24" aria-hidden>
                    <line x1="5" y1="9" x2="19" y2="9" />
                    <line x1="5" y1="15" x2="19" y2="15" />
                  </svg>
                  <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent
                align="end"
                // 4px from the pill's edges (sort.to's gap), measured from the icon inside it.
                alignOffset={-6}
                sideOffset={10}
                className="w-56 rounded-[6px]! bg-white font-[family-name:var(--font-inter)] shadow-md!"
              >
                {navLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild className={menuItem}>
                    <Link href={link.href} aria-current={isActive(link.href) ? "page" : undefined}>
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {/* Phones: the pill is just the icon, so these live here. */}
                {!account && (
                  <>
                    <DropdownMenuSeparator className="sm:hidden" />
                    <DropdownMenuItem asChild className={cn(menuItem, "sm:hidden")}>
                      <Link href="/login">Log in</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className={cn(menuItem, "sm:hidden")}>
                      <Link href="/signup">Create account</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
