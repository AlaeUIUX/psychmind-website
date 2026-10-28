"use client";

import { cn } from "cn";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { topicChip, topicChipOff, topicChipOn } from "@/components/home/search-styles";
import type { IndexedPost, PostSource } from "@/lib/blog";
import { postNumber } from "@/lib/blog-format";

// The blog index, after theboringblog.ai's: no pictures, just the posts, newest first,
// grouped by year (the year and its count in a column of their own on desktop). Each
// is its title, its line, and its number · date · reading time.
//
// Above them, two choices: whose posts (the PsychMind team's, or those of providers on
// PsychMind), a switch; then a category, chips (only the ones that list has). Both
// filter the list in place. The list grows as you scroll, a page at a time, until the
// end, which says so.

const ALL = "All";
const PAGE = 6;

// TODO(client): new copy, the switch's two labels and the end line
const SOURCES: { value: PostSource; label: string }[] = [
  { value: "team", label: "PsychMind team" },
  { value: "provider", label: "Providers" },
];

export function PostIndex({ posts }: { posts: IndexedPost[] }) {
  const [source, setSource] = useState<PostSource>("team");
  const [category, setCategory] = useState(ALL);
  const [count, setCount] = useState(PAGE);
  const end = useRef<HTMLDivElement>(null);

  const fromSource = useMemo(() => posts.filter((p) => p.source === source), [posts, source]);
  const categories = useMemo(() => [ALL, ...new Set(fromSource.map((p) => p.category))], [fromSource]);
  const shown = category === ALL ? fromSource : fromSource.filter((p) => p.category === category);
  const visible = shown.slice(0, count);
  const more = visible.length < shown.length;
  const years = [...new Set(visible.map((p) => p.year))];

  const pick = (next: { source?: PostSource; category?: string }) => {
    if (next.source) setSource(next.source);
    setCategory(next.category ?? ALL);
    setCount(PAGE);
  };

  // the next page comes in as the list's end nears (well before the shore covers it)
  useEffect(() => {
    const el = end.current;
    if (!el || !more) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setCount((c) => c + PAGE);
      },
      { rootMargin: "0px 0px 700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [more, visible.length]);

  return (
    <>
      <div className="mt-6 flex flex-col gap-4 lg:col-start-2">
        <p className="type-small text-text-placeholder">
          {fromSource.length} {fromSource.length === 1 ? "article" : "articles"}, and counting.
        </p>
        {/* whose posts: a two-way switch, its thumb sliding to the choice */}
        <div
          role="radiogroup"
          aria-label="Written by"
          className="relative grid w-fit grid-cols-2 rounded-pill border border-warm-200 bg-warm-100 p-1"
        >
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-pill bg-white shadow-control transition-transform duration-300 ease-out-soft motion-reduce:transition-none",
              source === "provider" && "translate-x-full",
            )}
          />
          {SOURCES.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={s.value === source}
              onClick={() => pick({ source: s.value })}
              className={cn(
                "relative h-8 cursor-pointer rounded-pill px-4 text-[13px] whitespace-nowrap transition-colors duration-200",
                s.value === source ? "text-text-primary" : "text-text-tertiary hover:text-text-primary",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        {categories.length > 2 && (
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={c === category}
                onClick={() => pick({ source, category: c })}
                className={cn(topicChip, "cursor-pointer", c === category ? topicChipOn : topicChipOff)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* the list changes in place; read out how many it now holds */}
      <p className="sr-only" aria-live="polite">
        {shown.length} {shown.length === 1 ? "article" : "articles"}
      </p>

      {years.map((year) => {
        const entries = visible.filter((p) => p.year === year);
        const total = shown.filter((p) => p.year === year).length;
        return (
          <div key={`${source}-${category}-${year}`} className="contents">
            <div className="mt-14 animate-fade-in lg:col-start-1 lg:mt-16 lg:pt-5">
              <p className="type-h2 text-text-primary">{year}</p>
              <p className="type-small text-text-tertiary">
                {total} {total === 1 ? "entry" : "entries"}
              </p>
            </div>
            <ul className="mt-4 lg:col-start-2 lg:mt-16">
              {entries.map((post) => (
                <li key={post.slug} className="animate-fade-in border-b border-warm-200 last:border-b-0">
                  <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-1.5 py-5">
                    <span className="type-reader-entry text-text-primary underline-offset-4 group-hover:underline">
                      {post.title}
                    </span>
                    <span className="type-body text-text-tertiary">{post.excerpt}</span>
                    <span className="type-small text-text-placeholder">
                      {postNumber(post.number)} · {post.date} · {post.readTime}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {shown.length === 0 && <p className="type-body mt-14 text-text-tertiary lg:col-start-2">No posts here yet.</p>}

      {/* where the next page loads; the end says so */}
      <div ref={end} className="mt-10 lg:col-start-2">
        {!more && shown.length > 0 && <p className="type-overline text-text-placeholder">That’s everything, for now</p>}
      </div>
    </>
  );
}
