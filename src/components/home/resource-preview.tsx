import Link from "next/link";
import { EditorialNote } from "@/components/blog/editorial-note";
import { PostStack } from "@/components/blog/post-stack";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { CtaArrowIcon } from "@/components/ui/hugeicons";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { getAllPosts } from "@/lib/blog";

// "Resource center": the blog's latest posts (content/blog, newest first; the
// featured one leads the blog page instead), stacked as Catalyst's selected
// work (post-stack.tsx). Six fill the rhythm once: two thirds and a third, one
// full width, three across.
export function ResourcePreview() {
  const posts = getAllPosts()
    .filter((p) => !p.featured)
    .slice(0, 6);

  return (
    <Section>
      <Container className="flex flex-col gap-10 sm:gap-12">
        <SectionHeader
          badge={{
            icon: "/images/home/resource-badge-icon.svg",
            label: "Resource center",
          }}
          title="Blogs from our fellow help providers"
          subtitle="Guides, insights, and perspectives on mental health, written by our experts"
          action={
            <Button asChild variant="secondary" size="lg">
              <Link href="/blog">
                Blogs
                <CtaArrowIcon />
              </Link>
            </Button>
          }
        />

        <Reveal>
          <PostStack posts={posts} />
        </Reveal>
        <EditorialNote />
      </Container>
    </Section>
  );
}
