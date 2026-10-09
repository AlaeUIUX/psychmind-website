"use client";

import { useEffect, useRef } from "react";
import type { ClientEvent, Page, TermParts } from "./events";

// Sends analytics in small batches to our own /api/events: no cookies, no
// third parties, nothing about who someone is. Batches go out every few
// seconds, and when the page is hidden (sendBeacon survives navigation).

const queue: ClientEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  while (queue.length) {
    const body = JSON.stringify({ events: queue.splice(0, 50) });
    const sent = typeof navigator !== "undefined" && navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }));
    if (!sent) void fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
  }
}

export function trackEvent(event: ClientEvent) {
  if (typeof window === "undefined") return;
  if (!listening) {
    listening = true;
    addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  }
  queue.push(event);
  if (queue.length >= 50) flush();
  else timer ??= setTimeout(flush, 4000);
}

/** Reports an event each time `key` changes. React runs effects twice in
 *  development; the ref keeps that from counting twice. */
export function useTrackOnChange(key: string, event: () => ClientEvent) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (last.current === key) return;
    last.current = key;
    trackEvent(event());
  }, [key, event]);
}

/** One page view per mount. */
export function useTrackView(page: Page) {
  useTrackOnChange(page, () => ({ t: "view", page }));
}

/** A full profile seen, once per provider per tab session (refreshes don't count again). */
export function useTrackProfileView(publicId: string) {
  useEffect(() => {
    const key = `psychmind:seen:${publicId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    trackEvent({ t: "profile_view", p: publicId });
  }, [publicId]);
}

const seen = new Set<string>();

/** Reports the element once it has been at least half on screen for a moment
 *  (an impression), once per provider per search. */
export function useImpression(publicId: string, term: TermParts, searchKey: string) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const key = `${searchKey}|${publicId}`;
    if (!el || seen.has(key) || typeof IntersectionObserver === "undefined") return;
    let wait: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          wait = setTimeout(() => {
            seen.add(key);
            trackEvent({ t: "impression", p: publicId, s: term });
            observer.disconnect();
          }, 600);
        } else if (wait) {
          clearTimeout(wait);
          wait = null;
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (wait) clearTimeout(wait);
    };
  }, [publicId, term, searchKey]);
  return ref;
}
