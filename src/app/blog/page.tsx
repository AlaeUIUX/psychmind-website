import type { Metadata } from "next";
import { Hero } from "@/components/blog/hero";
import { FeaturedPost } from "@/components/blog/featured-post";
import { PostGrid } from "@/components/blog/post-grid";
import { getAllPosts } from "@/lib/blog";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Resource center — PsychMind",
  description: "Guides, insights, and perspectives on mental health — written by your providers.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const rest = posts.filter((post) => post.slug !== featured?.slug);

  return (
    <section className="w-full flex flex-col items-center gap-10 pb-20 sm:pb-32 md:pb-40">
      <Reveal>
        <Hero />
      </Reveal>
      {featured && (
        <Reveal>
          <FeaturedPost post={featured} />
        </Reveal>
      )}
      <Reveal>
        <PostGrid posts={rest} />
      </Reveal>
    </section>
  );
}
