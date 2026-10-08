"use client";

import { cn } from "cn";
import { CalendarHeartIcon, CheckIcon, FlaskConicalIcon, Share2Icon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listJoin } from "@/lib/provider/display";
import { bannerCta } from "@/lib/taxonomy";
import { SaveButton, type Viewer } from "./save-button";

// Actions on a provider's quick view and public profile. All copy is new —
// TODO(client).

type ActionProvider = {
  id: string;
  name: string;
  bannerStyle?: string | null;
  isSample?: boolean;
  acceptingNewClients?: boolean;
};

/** "Request a session" in the provider's banner colour. The request flow
 *  itself comes later; for now it explains what happens and offers Save. */
export function RequestSessionButton({
  provider,
  viewer,
  saved,
  returnTo,
  className,
}: {
  provider: ActionProvider;
  viewer: Viewer;
  saved: boolean;
  returnTo: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { name } = provider;
  const notAccepting = provider.acceptingNewClients === false;

  const copy = provider.isSample
    ? {
        icon: FlaskConicalIcon,
        title: "This is a sample profile",
        body: `${name} is an example provider we created to show how PsychMind works. Verified providers will appear here as they join, and you'll be able to request sessions with them.`,
      }
    : notAccepting
      ? {
          icon: CalendarHeartIcon,
          title: `${name} isn't taking new clients right now`,
          body: `Save ${name}'s profile to check back later, or browse other verified providers who are accepting new clients.`,
        }
      : {
          icon: CalendarHeartIcon,
          title: "Session requests open soon",
          body: `You'll be able to request a session with ${name} right from this page. Save ${name} so you can find them again when requests open.`,
        };
  const Icon = copy.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={bannerCta(provider.bannerStyle)}
        className={cn(
          "flex h-10 w-full items-center justify-center rounded-field px-4 type-small font-semibold shadow-control transition-[filter,scale] duration-200 hover:brightness-95 focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none active:scale-[0.98]",
          className,
        )}
      >
        Request a session
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-warm-100 text-warm-700">
              <Icon className="size-5" />
            </span>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <SaveButton profileId={provider.id} name={name} initialSaved={saved} viewer={viewer} returnTo={returnTo} variant="full" />
            <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** The "Verified" chip, which explains what PsychMind checked. */
export function VerifiedExplainer({ name, states, className }: { name: string; states: string[]; className?: string }) {
  const where = states.length ? listJoin(states) : null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-tag border border-warm-300 bg-white px-2.5 py-1 text-sm font-medium text-text-secondary shadow-control transition-colors hover:border-warm-400 hover:text-text-primary focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none",
            className,
          )}
          aria-label="Verified by PsychMind — what does this mean?"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/how-it-works/verified-check-icon.svg" alt="" className="size-3.5" />
          Verified
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-4">
        <p className="flex items-center gap-2 type-small font-semibold text-text-primary">
          <ShieldCheckIcon className="size-4 text-emerald-600" />
          Verified by PsychMind
        </p>
        <ul className="mt-3 flex flex-col gap-2 type-small text-text-secondary">
          {[
            where ? `License checked with the licensing board in ${where}` : "License checked with the state licensing board",
            "Identity and National Provider Identifier (NPI) confirmed",
            "Re-checked whenever a license changes",
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 type-caption text-text-tertiary">Our team reviews every provider by hand before {name}&apos;s profile goes live.</p>
      </PopoverContent>
    </Popover>
  );
}

/** Share the profile link (native share sheet when there is one). */
export function ShareButton({ path, name, className }: { path: string; name: string; className?: string }) {
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} on PsychMind`, url });
        return;
      } catch {
        // Cancelled, or not allowed here: fall back to copying.
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }
  return (
    <Button type="button" variant="ghost" size="sm" onClick={share} className={cn("h-9 px-3 text-[14px]", className)}>
      <Share2Icon />
      Share
    </Button>
  );
}
