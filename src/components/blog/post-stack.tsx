import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Post } from "@/lib/blog";

// Posts stacked as Catalyst's "Selected work" stacks projects (after
// wearestokt.com/work): on a six-column grid, rows of changing widths, two
// thirds and a third, then one full width, then three across, and again;
// a last row that comes up short shares its width evenly. Every card in a row
// is the same height, its picture full bleed, and under it one small caption
// (rachelchen.tech's): the title, a faint slash, then what it is, softer.
// Below lg the cards stack one to a row.

type Row = "pair" | "wide" | "trio";

const RHYTHM: { row: Row; spans: number[] }[] = [
  { row: "pair", spans: [4, 2] },
  { row: "wide", spans: [6] },
  { row: "trio", spans: [2, 2, 2] },
];

function layout(count: number) {
  const out: { span: number; row: Row }[] = [];
  for (let r = 0; out.length < count; r++) {
    const { row, spans } = RHYTHM[r % RHYTHM.length];
    const left = count - out.length;
    if (left >= spans.length) spans.forEach((span) => out.push({ span, row }));
    else
      for (let i = 0; i < left; i++)
        out.push({ span: 6 / left, row: left === 1 ? "wide" : "pair" });
  }
  return out;
}

export function PostStack({ posts }: { posts: Post[] }) {
  const cells = layout(posts.length);
  return (
    <ol className="@container grid grid-cols-1 gap-x-4 gap-y-8 lg:grid-cols-6">
      {posts.map((post, i) => (
        <li
          key={post.slug}
          className="lg:col-span-(--span)"
          style={{ "--span": cells[i].span } as CSSProperties}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-2.5 rounded-card outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
          >
            <div
              className={`relative aspect-[16/10] w-full overflow-hidden rounded-card bg-blush-25 transition-colors duration-500 ease-out-soft group-hover:bg-warm-100 lg:aspect-auto ${
                cells[i].row === "wide"
                  ? "lg:h-[clamp(340px,48cqw,860px)]"
                  : "lg:h-[clamp(300px,34cqw,640px)]"
              }`}
            >
              {post.thumbnail ? (
                <Image
                  src={post.thumbnail}
                  alt=""
                  fill
                  sizes={`(min-width: 1024px) ${Math.round((cells[i].span / 6) * 1052)}px, 100vw`}
                  className="object-contain p-4 transition-[scale] duration-700 ease-out-soft group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/blog/psychmind-icon.svg"
                    alt=""
                    width={40}
                    height={40}
                  />
                  <span className="font-display text-2xl text-warm-900">
                    PsychMind
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 type-body text-text-primary">
              <h3>{post.title}</h3>
              <span aria-hidden className="opacity-30">
                /
              </span>
              <p className="text-text-tertiary">
                {post.category}, {post.readTime}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
