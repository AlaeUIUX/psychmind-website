"use client";

// The browser's Back/forward buttons, for "Leave without saving?".
// Next's router listens for popstate on window and Chrome runs window
// listeners in the order they were added, so a listener added later (by a
// page) can't stop it. This module adds ours as soon as the app's code loads,
// before the router's effect, and pages switch it on with setBackGuard().
// BackGuardBoot in the root layout makes sure it loads first.

type Guard = () => void;

let guard: Guard | null = null;
let skipNext = false;

if (typeof window !== "undefined") {
  window.addEventListener(
    "popstate",
    (e) => {
      // Our own step forward again (below): the router never sees it.
      if (skipNext) {
        skipNext = false;
        e.stopImmediatePropagation();
        return;
      }
      if (!guard) return;
      e.stopImmediatePropagation();
      // Put the URL back to this page while they decide.
      skipNext = true;
      window.history.go(1);
      guard();
    },
    true,
  );
}

/** While set, Back/forward calls `onAttempt` instead of navigating. */
export function setBackGuard(onAttempt: Guard | null) {
  guard = onAttempt;
}

/** Rendered once in the root layout so this module loads with the app. */
export function BackGuardBoot() {
  return null;
}
