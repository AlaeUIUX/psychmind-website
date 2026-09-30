import type { Post } from "@/lib/blog";
import { Reveal } from "@/components/reveal";
import { BlogCard } from "./blog-card";

export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <Reveal stagger className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
      {posts.map((post) => (
        <BlogCard
          key={post.slug}
          href={`/blog/${post.slug}`}
          image={post.thumbnail}
          category={post.category}
          author={post.author}
          title={post.title}
          meta={`${post.readTime} · ${post.date}`}
        />
      ))}
    </Reveal>
  );
}
