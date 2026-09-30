import type { Metadata } from "next";
import { Hero } from "@/components/blog/hero";
import { FeaturedPost } from "@/components/blog/featured-post";
import { PostGrid } from "@/components/blog/post-grid";
import { Container, Section } from "@/components/ui/section";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Resource center — PsychMind",
  description: "Guides, insights, and perspectives on mental health — written by your providers.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const rest = posts.filter((post) => post.slug !== featured?.slug);

  return (
    <>
      <Hero />
      <Section spacing="none" className="pb-16 sm:pb-24">
        <Container className="flex flex-col gap-4 sm:gap-6">
          {featured && <FeaturedPost post={featured} />}
          <PostGrid posts={rest} />
        </Container>
      </Section>
    </>
  );
}
