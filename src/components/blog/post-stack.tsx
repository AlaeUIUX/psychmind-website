import Link from "next/link";
import type { Post } from "@/lib/blog";
import { PostCover } from "./post-cover";

// The home page's Resource center: the posts as a plain grid, after incident.io/blog
// (owner, 2026-11-10): every card the same size, so every cover (post-cover.tsx) and
// its line are the same size too. Three across on computers, two on tablets, one on
// phones. Under each cover, one small caption (rachelchen.tech's): the title, a faint
// slash, then what it is, softer.

export function PostStack({ posts }: { posts: Post[] }) {
  return (
    <ol className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-3 rounded-card outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
          >
            <div className="overflow-hidden rounded-card">
              <PostCover spot={post.cover} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="type-body font-medium text-balance text-text-primary">{post.title}</h3>
              <p className="type-small text-text-tertiary">
                {post.category} · {post.readTime} · {post.author}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
