"use client";

import { cn } from "cn";
import { ChevronDownIcon, LogOutIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GUTTER } from "@/components/ui/section";

export type AppNavItem = { href: string; label: string; badge?: ReactNode };

export type AppUser = {
  name: string;
  email?: string;
  avatarUrl?: string;
  /** Links in the account menu, e.g. Settings, Billing. */
  menu?: { href: string; label: string }[];
};

type AppShellProps = {
  nav: AppNavItem[];
  user: AppUser;
  /** Where the logo goes (the area's home). */
  homeHref?: string;
  /** Account-level banner slot (StatusBanner), shown above every page. */
  banner?: ReactNode;
  /** Logs out; wired to the auth server action in the auth slice. */
  onSignOut?: () => void;
  children: ReactNode;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// The frame for every signed-in area (provider dashboard, patient account,
// admin). Figma's dashboard header: logo, centred nav, avatar pill with a
// menu; on phones the nav moves into a sheet. A slim footer replaces the
// marketing footer (which shows Log in / Create account, wrong once signed in).
export function AppShell({ nav, user, homeHref = "/", banner, onSignOut, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navLinks = (onNavigate?: () => void, vertical = false) =>
    nav.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive(item.href) ? "page" : undefined}
        className={cn(
          "inline-flex items-center gap-2 rounded-pill px-3 py-2 text-sm font-medium transition-colors duration-200",
          vertical && "h-11 w-full px-4 text-md",
          isActive(item.href)
            ? "bg-warm-100 text-text-primary"
            : "text-text-secondary hover:bg-warm-100/70 hover:text-text-primary",
        )}
      >
        {item.label}
        {item.badge}
      </Link>
    ));

  return (
    <div className="flex min-h-svh flex-col bg-warm-25">
      <a
        href="#main"
        className="sr-only z-[60] rounded-pill bg-warm-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className={cn("sticky top-0 z-50 border-b border-warm-200/80 bg-warm-25/85 backdrop-blur-md", GUTTER)}>
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="-ml-2 md:hidden" aria-label="Open menu">
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] gap-0 p-4">
                <SheetHeader className="px-1 pb-4">
                  <SheetTitle className="font-display text-xl font-normal">PsychMind</SheetTitle>
                </SheetHeader>
                <nav aria-label="Main" className="flex flex-col gap-1">
                  {navLinks(() => setMenuOpen(false), true)}
                </nav>
              </SheetContent>
            </Sheet>
            <Link href={homeHref} className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/home/logo.svg" alt="" width={28} height={28} />
              <span className="font-display text-xl text-warm-900">PsychMind</span>
            </Link>
          </div>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {navLinks()}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-pill border border-warm-200 bg-white py-1 pr-2.5 pl-1 shadow-control transition-colors hover:bg-warm-50 focus-visible:ring-4 focus-visible:ring-ring/12 focus-visible:outline-none"
                aria-label={`Account menu for ${user.name}`}
              >
                <Avatar className="size-7">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                  <AvatarFallback className="bg-warm-200 text-xs font-medium text-warm-800">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[160px] truncate text-sm font-medium text-text-primary sm:inline">
                  {user.name}
                </span>
                <ChevronDownIcon aria-hidden className="size-4 text-warm-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-text-primary">{user.name}</span>
                {user.email && <span className="truncate text-xs font-normal text-text-placeholder">{user.email}</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(user.menu ?? []).map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              {onSignOut && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onSignOut}>
                    <LogOutIcon />
                    Log out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main id="main" className={cn("flex-1 py-8 sm:py-10", GUTTER)}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
          {banner}
          {children}
        </div>
      </main>

      <footer className={cn("border-t border-warm-200 py-6", GUTTER)}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 type-small text-text-placeholder sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PsychMind. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/privacy-policy" className="hover:text-text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-text-primary">
              Terms of Usage
            </Link>
            <a href="tel:988" className="font-medium text-text-secondary hover:text-text-primary">
              In crisis? Call or text 988
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
