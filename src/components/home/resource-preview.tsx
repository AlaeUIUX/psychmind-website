import Link from "next/link";
import { BlogCard } from "@/components/blog/blog-card";
import { EditorialNote } from "@/components/blog/editorial-note";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

const posts = [
  {
    category: "Mental health",
    author: "Dr. Danny Schwelberg",
    title: "How to know when you're ready to start therapy — and what to expect",
    meta: "8 min read · March 2025",
    image: "/images/home/blog-thumb-1.png",
    slug: "ready-to-start-therapy",
  },
  {
    category: "Guide",
    author: "PsychMind Team",
    title: "CBT vs. psychodynamic therapy: which is right for you?",
    meta: "5 min read · Feb 2025",
    image: "/images/home/blog-thumb-2.png",
    slug: "cbt-vs-psychodynamic-therapy",
  },
  {
    category: "Wellness",
    author: "Dr. Sara Olisz",
    title: "Five signs that anxiety is affecting your daily life more than you think",
    meta: "4 min read · Jan 2025",
    image: "/images/home/blog-thumb-3-illustration.png",
    slug: "signs-anxiety-affecting-daily-life",
  },
  {
    category: "Design and Dev",
    author: "PsychMind Team",
    title: "How we designed PsychMind AI search tool in 6 months",
    meta: "12 min read · Jan 2025",
    image: "/images/home/blog-thumb-4.png",
    slug: "designing-psychmind-ai-search",
  },
];

export function ResourcePreview() {
  return (
    <Section>
      <Container className="flex flex-col gap-10 sm:gap-12">
        <SectionHeader
          badge={{ icon: "/images/home/resource-badge-icon.svg", label: "Resource center" }}
          title="Blogs from our fellow help providers"
          subtitle="Guides, insights, and perspectives on mental health — written by our experts"
          action={
            <Button asChild size="lg">
              <Link href="/blog">
                Blogs
                <CircleArrowIcon />
              </Link>
            </Button>
          }
        />

        <Reveal stagger className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              href={`/blog/${post.slug}`}
              image={post.image}
              category={post.category}
              author={post.author}
              title={post.title}
              meta={post.meta}
            />
          ))}
        </Reveal>
        <EditorialNote />
      </Container>
    </Section>
  );
}
