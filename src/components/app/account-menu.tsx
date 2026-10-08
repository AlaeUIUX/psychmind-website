"use client";

import { ChevronDownIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AppUser = {
  name: string;
  email?: string;
  avatarUrl?: string;
  /** Links in the account menu, e.g. Settings, Billing. */
  menu?: { href: string; label: string }[];
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Figma's avatar pill (avatar, name, chevron) with the account menu. */
export function AccountMenu({ user, onSignOut }: { user: AppUser; onSignOut?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-pill border border-warm-200 bg-white py-1 pr-2.5 pl-1 shadow-control transition-colors hover:bg-warm-50 focus-visible:ring-4 focus-visible:ring-ring/12 focus-visible:outline-none"
          aria-label={`Account menu for ${user.name}`}
        >
          <Avatar className="size-7">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="bg-warm-200 text-xs font-medium text-warm-800">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[160px] truncate text-sm font-medium text-text-primary sm:inline">{user.name}</span>
          <ChevronDownIcon aria-hidden className="size-4 text-warm-600" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-text-primary">{user.name}</span>
          {user.email && <span className="truncate text-xs font-normal text-text-placeholder">{user.email}</span>}
        </DropdownMenuLabel>
        {user.menu?.length ? (
          <>
            <DropdownMenuSeparator />
            {user.menu.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
        {onSignOut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onSignOut()}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
