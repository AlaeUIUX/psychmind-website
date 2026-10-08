"use client";

import { cn } from "cn";
import { HeartIcon } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { setProviderSaved } from "@/server/directory/actions";

// The heart. Patients save straight away (with Undo); anyone signed out is
// asked to create an account or log in, then brought back here with the
// provider saved (?save=1). Copy: TODO(client).

export type Viewer = { role: "patient" | "provider" | "admin" | null };

/** Shares saved state between every heart for the same provider on a page
 *  (a card and its quick view stay in sync). */
const SavedContext = createContext<{ isSaved: (id: string) => boolean; set: (id: string, saved: boolean) => void } | null>(null);

export function SavedProvidersProvider({ initial, children }: { initial: string[]; children: ReactNode }) {
  const [ids, setIds] = useState(() => new Set(initial));
  const set = useCallback(
    (id: string, saved: boolean) =>
      setIds((prev) => {
        const next = new Set(prev);
        if (saved) next.add(id);
        else next.delete(id);
        return next;
      }),
    [],
  );
  const value = useMemo(() => ({ isSaved: (id: string) => ids.has(id), set }), [ids, set]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

/** Whether a provider is saved, from the shared state on this page. */
export function useSavedIds() {
  const shared = useContext(SavedContext);
  return (id: string) => shared?.isSaved(id) ?? false;
}

/** Create-account / log-in prompt for actions that need a patient account. */
export function AccountPrompt({
  open,
  onOpenChange,
  title,
  description,
  returnTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  returnTo: string;
}) {
  const next = encodeURIComponent(returnTo);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild fullWidth>
            <Link href={`/signup/patient?next=${next}`}>Create a free account</Link>
          </Button>
          <Button asChild variant="secondary" fullWidth>
            <Link href={`/login?next=${next}`}>Log in</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SaveButton({
  profileId,
  name,
  initialSaved,
  viewer,
  returnTo,
  variant = "icon",
  autoSave = false,
  className,
}: {
  profileId: string;
  /** First name (or business name) for the prompt copy. */
  name: string;
  initialSaved: boolean;
  viewer: Viewer;
  /** Where to come back to after signing up or logging in. */
  returnTo: string;
  variant?: "icon" | "full";
  /** Save on arrival (after an account prompt brought them back). */
  autoSave?: boolean;
  className?: string;
}) {
  const shared = useContext(SavedContext);
  const [localSaved, setLocalSaved] = useState(initialSaved);
  const saved = shared ? shared.isSaved(profileId) : localSaved;
  const setSaved = (value: boolean) => (shared ? shared.set(profileId, value) : setLocalSaved(value));
  const [prompt, setPrompt] = useState(false);
  const [pending, startTransition] = useTransition();
  const autoSaved = useRef(false);

  const persist = (next: boolean, { quiet = false } = {}) =>
    startTransition(async () => {
      const result = await setProviderSaved(profileId, next);
      if (!result.ok) {
        setSaved(!next);
        if (result.reason === "auth") setPrompt(true);
        else if (result.reason === "role") toast.info("Saving providers is for patient accounts.");
        else if (result.reason === "rate") toast.error("You're doing that a lot. Try again in a minute.");
        else toast.error("We couldn't save this provider. Please try again.");
        return;
      }
      setSaved(result.saved);
      if (quiet) return;
      if (result.saved) {
        toast.success(`${name} saved`, {
          description: "Find them any time under Saved providers in your account.",
          action: { label: "Undo", onClick: () => toggle(false, { quiet: true }) },
        });
      } else {
        toast(`${name} removed from your saved providers`);
      }
    });

  function toggle(next: boolean, opts?: { quiet?: boolean }) {
    if (!viewer.role) return setPrompt(true);
    if (viewer.role !== "patient") return toast.info("Saving providers is for patient accounts.");
    setSaved(next);
    persist(next, opts);
  }

  // Back from signing up or logging in to save this provider.
  useEffect(() => {
    if (!autoSave || autoSaved.current || viewer.role !== "patient") return;
    autoSaved.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete("save");
    window.history.replaceState(null, "", url);
    if (!initialSaved) persist(true);
    // persist is stable enough for a one-time run on arrival.
  }, [autoSave, viewer.role, initialSaved]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = saved ? `Saved — remove ${name} from saved providers` : `Save ${name}`;
  const promptReturn = `${returnTo}${returnTo.includes("?") ? "&" : "?"}save=1`;

  return (
    <>
      {variant === "icon" ? (
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-pressed={saved}
          aria-label={label}
          title={saved ? "Saved" : "Save"}
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            toggle(!saved);
          }}
          className={cn("shrink-0 rounded-full", saved && "border-warm-900 bg-warm-900 text-white hover:bg-warm-800", className)}
        >
          <HeartIcon className={cn("transition-transform duration-200", saved && "scale-110 fill-current text-white")} />
        </Button>
      ) : (
        <Button
          type="button"
          variant={saved ? "primary" : "secondary"}
          aria-pressed={saved}
          aria-label={label}
          disabled={pending}
          onClick={() => toggle(!saved)}
          className={cn("h-10 text-[15px]", className)}
          fullWidth
        >
          <HeartIcon className={cn(saved && "fill-current text-white")} />
          {saved ? "Saved" : "Save profile"}
        </Button>
      )}
      <AccountPrompt
        open={prompt}
        onOpenChange={setPrompt}
        title={`Save ${name} for later`}
        description="Create a free account to save providers, come back to them anytime, and request sessions when you're ready."
        returnTo={promptReturn}
      />
    </>
  );
}
