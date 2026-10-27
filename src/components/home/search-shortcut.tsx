"use client";

import { useEffect, useState } from "react";
import { getLenis } from "@/components/motion/smooth-scroll";
import { ArrowUpIcon } from "@/components/ui/hugeicons";
import { MOTION_OK } from "@/lib/gsap";

// "Start a search": a pill that follows you down the landing page, bottom right, after
// the agency site's scroll cue (catalystdlab.com, ScrollCue). It is the header's menu
// pill (the "Menu pill" in globals.css: light frosted glass, 14px corners, 32px blocks
// at 8px), a little frostier to float over the page: the label in dark text like the
// header's Log in, then an arrow. On hover (or keyboard focus) the label rolls up and
// comes round again, both blocks take Log in's hover tint, and the arrow rises on a
// loop. It shows once the hero (the search and the boat band) has scrolled away and
// steps aside when the footer takes over the screen, so it never sits on the search it
// points to or on the footer's links. A click glides back up: on desktop into "What's
// on your mind?", opening its suggestions; on phones to the search button.
//
// A plain button rather than <Button>: it is the menu pill's design, which the shared
// variants don't express.

export function SearchShortcut() {
  const [pastHero, setPastHero] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const watchers: IntersectionObserver[] = [];
    const hero = document.getElementById("hero");
    if (hero) {
      // past the hero once it's wholly above the screen (not while it's below, on load)
      const w = new IntersectionObserver((entries) => {
        const e = entries[entries.length - 1];
        setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0);
      });
      w.observe(hero);
      watchers.push(w);
    }
    const footer = document.querySelector("footer");
    if (footer) {
      // the footer reaching the middle of the screen
      const w = new IntersectionObserver((entries) => setAtFooter(entries[entries.length - 1].isIntersecting), {
        rootMargin: "0px 0px -50% 0px",
      });
      w.observe(footer);
      watchers.push(w);
    }
    return () => watchers.forEach((w) => w.disconnect());
  }, []);

  const shown = pastHero && !atFooter;

  const backToSearch = () => {
    const search = document.getElementById("hero-search");
    if (!search) return;
    const land = () => {
      // the desktop bar's text field when it's showing, else the phone's search button
      const field = document.getElementById("hero-mind");
      const target = field && field.offsetParent !== null ? field : search.querySelector("button");
      target?.focus({ preventScroll: true });
    };
    // to the top if the search fits on screen from there, else just below the header
    const box = search.getBoundingClientRect();
    const docTop = box.top + window.scrollY;
    const top = docTop + box.height + 24 <= window.innerHeight ? 0 : Math.max(0, docTop - 120);
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(top, { duration: 1.4, onComplete: land });
    } else {
      const smooth = window.matchMedia(MOTION_OK).matches;
      window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
      if (smooth) window.setTimeout(land, 700);
      else land();
    }
  };

  return (
    <div
      inert={!shown}
      className={`fixed right-5 bottom-5 z-40 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] transition-[opacity,translate] duration-500 ease-out-soft motion-reduce:transition-none lg:right-14 lg:bottom-8 ${
        shown ? "" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={backToSearch}
        data-float
        className="menu-pill group cursor-pointer whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {/* Log in's block: dark text, its tint on hover. The label twice in one
            line's height, the second rolling up into view on hover. */}
        <span className="h-8 overflow-hidden rounded-tag px-3 transition-colors duration-400 ease-out-soft group-hover:bg-warm-900/6 group-focus-visible:bg-warm-900/6 motion-reduce:transition-none">
          <span className="flex flex-col transition-[translate] duration-600 ease-out-soft group-hover:-translate-y-8 group-focus-visible:-translate-y-8 motion-reduce:transition-none">
            {/* TODO(client): new microcopy */}
            <span className="h-8 leading-8">Start a search</span>
            <span aria-hidden className="h-8 leading-8">
              Start a search
            </span>
          </span>
        </span>
        <span className="grid size-8 place-items-center overflow-hidden rounded-tag transition-colors duration-400 group-hover:bg-warm-900/6 group-focus-visible:bg-warm-900/6">
          <ArrowUpIcon className="size-4 group-hover:animate-cue-rise group-focus-visible:animate-cue-rise motion-reduce:animate-none" />
        </span>
      </button>
    </div>
  );
}
