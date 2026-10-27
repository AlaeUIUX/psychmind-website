"use client";

import { LoaderCircleIcon } from "@/components/ui/hugeicons";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { setBackGuard } from "./back-guard";

// "Leave without saving?": while `when` is true, leaving the page asks first.
// - Links anywhere on the page (step rail, Go back, Save & exit, the logo):
//   caught before Next's own click handler, then followed if they agree.
// - The browser's Back button, within the app: caught before Next's router
//   sees it (back-guard.tsx), and the URL is put back while they decide.
// - Closing the tab or reloading: the browser's own "Leave site?" prompt
//   (browsers don't allow a custom one there).
// With `onSaveAndLeave`, the dialog also offers to save first.
// TODO(client): copy.

export const LEAVE_BACK = "__back__";

type Pending = { href: string } | null;

function sameDocument(url: URL) {
  return url.pathname === window.location.pathname && url.search === window.location.search;
}

export function UnsavedChangesGuard({
  when,
  onSaveAndLeave,
  saving = false,
}: {
  when: boolean;
  /** Saves, then goes to `href` (LEAVE_BACK = the previous page). */
  onSaveAndLeave?: (href: string) => void;
  saving?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending>(null);
  const active = useRef(when);

  useEffect(() => {
    active.current = when;
    if (!when) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!active.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    // Capture phase on the document runs before React's handlers on the
    // root, so a Next <Link> never starts navigating.
    const onClick = (e: MouseEvent) => {
      if (!active.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.closest("[data-unsaved-guard]")) return;
      const url = new URL(anchor.href, window.location.href);
      // Other sites get the browser's own prompt (beforeunload).
      if (url.origin !== window.location.origin || sameDocument(url)) return;
      e.preventDefault();
      e.stopPropagation();
      setPending({ href: url.pathname + url.search + url.hash });
    };

    setBackGuard(() => setPending({ href: LEAVE_BACK }));

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      setBackGuard(null);
    };
  }, [when]);

  const leave = (href: string) => {
    active.current = false;
    setBackGuard(null);
    setPending(null);
    if (href === LEAVE_BACK) window.history.back();
    else router.push(href);
  };

  return (
    <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
      <AlertDialogContent className="app-ui data-[size=default]:sm:max-w-[560px]" data-unsaved-guard>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>Some changes on this page haven&apos;t been saved yet. If you leave now, they&apos;ll be lost.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-between">
          <AlertDialogCancel>Stay on this page</AlertDialogCancel>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="secondary" size="default" onClick={() => pending && leave(pending.href)}>
              Leave without saving
            </Button>
            {onSaveAndLeave && (
              <Button
                type="button"
                size="default"
                disabled={saving}
                aria-busy={saving || undefined}
                onClick={() => {
                  if (!pending) return;
                  const href = pending.href;
                  setPending(null);
                  onSaveAndLeave(href);
                }}
              >
                {saving && <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />}
                Save and leave
              </Button>
            )}
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
