"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { AccountMenu, type AppUser } from "@/components/app/account-menu";
import { Button } from "@/components/ui/button";
import {
  ChartLineIcon,
  CreditCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MegaphoneIcon,
  PanelLeftIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/hugeicons";
import { Kbd } from "@/components/ui/kbd";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CHANGELOG_SEEN_KEY } from "@/lib/changelog";
import { SIDEBAR_COOKIE } from "@/lib/dashboard";

// The frame for areas people work in, day after day: the provider dashboard
// and the admin console (patients keep AppShell's calm top nav). After the
// Untitled UI dashboards (Jordan Hughes) and Interfere: full screen, the sidebar
// the same white as the page, set apart only by the top bar's hairline. The sidebar folds to an icon rail (the top bar's toggle, ⌘/Ctrl B, remembered in a
// cookie so it never flashes), a top bar with the page's name, and the page
// scrolling on its own. The logo stands alone with the area as a pill ("Admin
// console"). Below lg the sidebar opens as a sheet.

const ICONS = {
  overview: LayoutDashboardIcon,
  requests: InboxIcon,
  analytics: ChartLineIcon,
  profile: UserCircleIcon,
  billing: CreditCardIcon,
  settings: SettingsIcon,
  queue: ShieldCheckIcon,
  providers: UsersIcon,
  recovery: LifeBuoyIcon,
  admins: UserIcon,
} as const;

export type DashboardIcon = keyof typeof ICONS;
export type DashboardNavItem = { href: string; label: string; icon: DashboardIcon; /** A count shown as a small ink pill (new requests…). */ badge?: number };
export type DashboardNavGroup = { label?: string; items: DashboardNavItem[] };

type DashboardShellProps = {
  groups: DashboardNavGroup[];
  user: AppUser;
  /** Where the logo goes (the area's home). */
  homeHref: string;
  /** The area, as a pill beside the logo ("Admin console"). */
  area?: string;
  /** What's new: its page, and the newest entry this audience can see. */
  whatsNew?: { href: string; latestId?: string; latestTitle?: string };
  /** Account-level notice (StatusBanner). Shown under the page header. */
  banner?: ReactNode;
  onSignOut?: () => void;
  /** The sidebar starts folded (the layout reads the cookie). */
  defaultCollapsed?: boolean;
  /** Fill a fixed-height box instead of the window (the /dev/ui kitchen sink). */
  preview?: boolean;
  children: ReactNode;
};


// ---------------------------------------------------------------------------
// The account notice, under each page's header (PageHeader renders the slot).

const BannerContext = createContext<ReactNode>(null);

/** Where the shell's notice appears: PageHeader puts it under the title. */
export function DashboardBannerSlot() {
  const banner = useContext(BannerContext);
  return banner ? <div className="animate-ui-enter">{banner}</div> : null;
}

// ---------------------------------------------------------------------------
// What's new: "seen" lives in this browser only; the page marks it and tells
// open shells straight away.

const SEEN_EVENT = "pm:changelog-seen";
function readSeen() {
  try {
    return window.localStorage.getItem(CHANGELOG_SEEN_KEY);
  } catch {
    return null;
  }
}
function subscribeSeen(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SEEN_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SEEN_EVENT, onChange);
  };
}

/** Put on the What's new page: remembers its newest entry as seen. */
export function MarkChangelogSeen({ latestId }: { latestId?: string }) {
  useEffect(() => {
    if (!latestId) return;
    try {
      window.localStorage.setItem(CHANGELOG_SEEN_KEY, latestId);
    } catch {
      // private window or blocked storage: the dot simply stays
    }
    window.dispatchEvent(new Event(SEEN_EVENT));
  }, [latestId]);
  return null;
}

// ---------------------------------------------------------------------------

/** The mark alone (no wordmark), and the area as a pill. */
function Logo({ href, area, collapsed }: { href: string; area?: string; collapsed?: boolean }) {
  return (
    <div className={cn("flex h-9 items-center gap-2", collapsed ? "justify-center" : "px-2")}>
      <Link href={href} className="flex size-7 shrink-0 items-center justify-center rounded-full" aria-label="PsychMind home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/home/logo.svg" alt="" width={24} height={24} />
      </Link>
      {!collapsed && area && (
        <span className="truncate rounded-pill border border-warm-900/10 bg-white px-2.5 py-0.5 text-xs leading-[18px] font-medium text-warm-900/70">{area}</span>
      )}
    </div>
  );
}

/** A label beside a folded rail's icon. */
function RailTip({ show, label, children }: { show: boolean; label: string; children: ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function DashboardShell({ groups, user, homeHref, area, whatsNew, banner, onSignOut, defaultCollapsed = false, preview, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [sheetOpen, setSheetOpen] = useState(false);
  const seen = useSyncExternalStore(subscribeSeen, readSeen, () => null);
  const unread = !!whatsNew?.latestId && seen !== whatsNew.latestId;

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });

  // ⌘/Ctrl B folds the sidebar (not while typing).
  useEffect(() => {
    if (preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "b" || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  // The most specific matching link wins, so /provider/requests lights up
  // Requests, not also Overview (/provider).
  const items = groups.flatMap((g) => g.items);
  const all = [...items.map((i) => ({ href: i.href, label: i.label })), ...(whatsNew ? [{ href: whatsNew.href, label: "What's new" }] : [])];
  const active = all.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)).sort((a, b) => b.href.length - a.href.length)[0];

  const link = (label: string, href: string, Icon: typeof InboxIcon, fold: boolean, onNavigate?: () => void, badge?: number, dot?: boolean) => {
    const on = href === active?.href;
    return (
      <RailTip key={href} show={fold} label={label}>
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={on ? "page" : undefined}
          className={cn(
            "relative flex h-9 items-center gap-2.5 rounded-[10px] text-[13.5px] font-medium tracking-[-0.01em] transition-[background-color,color,box-shadow] duration-200",
            fold ? "w-9 justify-center" : "px-2.5",
            on
              ? "bg-warm-900/[0.05] text-warm-900"
              : "text-warm-900/65 hover:bg-warm-900/[0.03] hover:text-warm-900",
          )}
        >
          <Icon aria-hidden className={cn("size-[18px] shrink-0", on ? "text-warm-900" : "text-warm-900/50")} />
          <span className={fold ? "sr-only" : "truncate"}>{label}</span>
          {badge ? (
            fold ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-warm-900/40">
                <span className="sr-only">{badge} new</span>
              </span>
            ) : (
              // a plain count, as Untitled UI's: grey figures on the faintest tile
              <span className="ml-auto rounded-[6px] bg-warm-900/[0.04] px-1.5 py-px text-xs leading-[18px] font-medium text-warm-900/60 tabular-nums">
                {badge}
                <span className="sr-only"> new</span>
              </span>
            )
          ) : null}
          {dot && (
            <span className={cn("rounded-full bg-blue-600", fold ? "absolute top-1.5 right-1.5 size-2 ring-2 ring-white/80" : "ml-auto size-2")}>
              <span className="sr-only">New updates</span>
            </span>
          )}
        </Link>
      </RailTip>
    );
  };

  /** The sidebar's contents, folded or open (the sheet is always open). */
  const body = (fold: boolean, onNavigate?: () => void) => (
    <div className={cn("flex h-full flex-col gap-5 py-3", fold ? "items-center px-2" : "px-3")}>
      <Logo href={homeHref} area={area} collapsed={fold} />
      <nav aria-label="Main" className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto [scrollbar-width:none]", fold && "items-center")}>
        {groups.map((group, g) => (
          <div key={group.label ?? g} className={cn("flex flex-col gap-0.5", fold && "items-center")}>
            {group.label &&
              (fold ? (
                g > 0 && <span aria-hidden className="my-1.5 h-px w-5 bg-warm-900/10" />
              ) : (
                <p className="px-2.5 pt-1 pb-1 text-xs leading-4 text-warm-900/50">{group.label}</p>
              ))}
            {group.items.map((i) => link(i.label, i.href, ICONS[i.icon], fold, onNavigate, i.badge))}
          </div>
        ))}
      </nav>
      <div className={cn("flex flex-col gap-2", fold && "items-center")}>
        {whatsNew &&
          (fold ? (
            link("What's new", whatsNew.href, MegaphoneIcon, true, onNavigate, undefined, unread)
          ) : (
            // Untitled UI's feature card: the newest entry, one click away. TODO(client): "What's new".
            <Link
              href={whatsNew.href}
              onClick={onNavigate}
              aria-current={active?.href === whatsNew.href ? "page" : undefined}
              className="group/new flex flex-col gap-1 rounded-[12px] bg-white p-3 shadow-[0_1px_2px_rgb(28_25_23/0.04),0_0_0_1px_rgb(28_25_23/0.06)] transition-colors hover:bg-warm-900/[0.02]"
            >
              <span className="flex items-center gap-1.5 text-[13px] leading-[18px] font-medium text-warm-900">
                <MegaphoneIcon aria-hidden className="size-3.5 text-warm-900/60" />
                What&apos;s new
                {unread && (
                  <span className="ml-auto size-2 rounded-full bg-blue-600">
                    <span className="sr-only">New updates</span>
                  </span>
                )}
              </span>
              {whatsNew.latestTitle && <span className="line-clamp-2 text-xs leading-4 text-warm-900/60">{whatsNew.latestTitle}</span>}
            </Link>
          ))}
        {!onNavigate && <AccountMenu user={user} onSignOut={onSignOut} variant={fold ? "avatar" : "row"} />}
      </div>
    </div>
  );

  return (
    // .app-ui: the portal look (the site's Inter and greys, blue accent, product-sized controls).
    <div className={cn("app-ui relative isolate flex bg-white", preview ? "h-full" : "h-svh")}>
      <a
        href="#main"
        className="sr-only z-[60] rounded-pill bg-warm-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <div className="flex min-w-0 flex-1 overflow-hidden">
        <aside
          aria-label="Sidebar"
          data-collapsed={collapsed || undefined}
          className={cn(
            "relative hidden shrink-0 border-r border-warm-900/[0.06] transition-[width] duration-200 ease-out-soft motion-reduce:transition-none lg:block",
            collapsed ? "w-[60px]" : "w-[248px]",
          )}
        >
          {body(collapsed)}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-warm-900/[0.06] px-3">
            {/* Phones and tablets: the menu. */}
            <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu" onClick={() => setSheetOpen(true)}>
              <PanelLeftIcon />
            </Button>
            {/* Desktop: fold or open the sidebar. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hidden text-warm-900/60 lg:inline-flex"
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-expanded={!collapsed}
                  onClick={toggle}
                >
                  <PanelLeftIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-2">
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
                <Kbd small meta>
                  B
                </Kbd>
              </TooltipContent>
            </Tooltip>
            <span aria-hidden className="h-4 w-px bg-warm-900/10" />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="lg:hidden">
                <Logo href={homeHref} area={area} />
              </span>
              {active && <span className="hidden truncate text-[13px] font-medium text-warm-900 lg:inline">{active.label}</span>}
            </div>
            <span className="lg:hidden">
              <AccountMenu user={user} onSignOut={onSignOut} />
            </span>
          </header>

          <main id="main" data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto">
            <BannerContext.Provider value={banner}>
              <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-8 px-4 py-8 sm:px-8 lg:px-10">{children}</div>
            </BannerContext.Provider>

            <footer className="mx-auto w-full max-w-[1080px] px-4 pb-6 sm:px-8 lg:px-10">
              <div className="flex flex-col gap-3 border-t border-warm-900/[0.06] pt-5 type-ui-small text-warm-900/50 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} PsychMind. All rights reserved.</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <Link href="/privacy-policy" className="hover:text-warm-900">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="hover:text-warm-900">
                    Terms of Usage
                  </Link>
                  <a href="tel:988" className="font-medium text-warm-900/70 hover:text-warm-900">
                    In crisis? Call or text 988
                  </a>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="app-ui w-[288px] gap-0 border-r-0 bg-white p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          {body(false, () => setSheetOpen(false))}
        </SheetContent>
      </Sheet>
    </div>
  );
}
