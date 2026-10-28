"use client";

import { cn } from "cn";
import { useEffect, useState, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

// A blog post, read as theboringblog.ai's are: the page snaps from one part to the
// next (each part a screen tall at least, a longer one scrolling freely inside it;
// the snap is in globals.css, html.reader-snap and .reader-beat), under the site's
// header in the blog's variant (Go back, Subscribe, the menu), with a rail of the
// parts down the left on desktop that shows where you are and takes you to any of them.

export type ReaderPart = { id: string; name: string };

export function Reader({ parts, children }: { parts: ReaderPart[]; children: ReactNode }) {
  const [active, setActive] = useState(parts[0]?.id);

  // the snap is the page's own, for as long as the post is open
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("reader-snap");
    return () => html.classList.remove("reader-snap");
  }, []);

  // where you are: the last part whose top has passed two fifths of the screen
  useEffect(() => {
    const beats = parts.map((p) => document.getElementById(p.id)).filter((el): el is HTMLElement => !!el);
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let current = beats[0];
      for (const el of beats) if (el.getBoundingClientRect().top <= line) current = el;
      if (current) setActive(current.id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [parts]);

  const go = (id: string) => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: still ? "auto" : "smooth" });
  };

  return (
    <>
      {/* the site's header in the blog's variant (Go back, Subscribe, the menu), pinned
          over the page; a fade of the paper under it so the text passes under softly */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24 bg-linear-to-b from-warm-25 via-warm-25/85 to-transparent" />
      <SiteHeader variant="blog" fixed />

      {/* the parts, down the left on desktop */}
      <nav aria-label="Parts of this post" className="fixed top-1/2 left-6 z-20 hidden -translate-y-1/2 xl:block">
        <ol className="flex flex-col gap-1">
          {parts.map((p) => {
            const current = p.id === active;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => go(p.id)}
                  aria-current={current ? "step" : undefined}
                  className="group flex items-center gap-3 py-1 text-left"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-px transition-[width,background-color] duration-300 ease-out-soft",
                      current ? "w-6 bg-brand-primary" : "w-4 bg-warm-400 group-hover:w-5 group-hover:bg-warm-600",
                    )}
                  />
                  <span
                    className={cn(
                      "type-small max-w-[200px] truncate transition-colors duration-300",
                      current ? "text-text-primary" : "text-text-placeholder group-hover:text-text-secondary",
                    )}
                  >
                    {p.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {children}
    </>
  );
}

/** One part: at least a screen tall, a snap point at its top. */
export function Beat({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("reader-beat relative min-h-svh px-6 pt-28 pb-32", className)}>
      <div className="mx-auto w-full max-w-[600px]">{children}</div>
    </section>
  );
}
