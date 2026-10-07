import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArticleArt } from "@/components/blog/article-art";
import { BlogCard, PostMeta } from "@/components/blog/blog-card";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { AuthorBar } from "@/components/shared/author-bar";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, CircleArrowIcon } from "@/components/ui/icons";
import { Container, Section } from "@/components/ui/section";
import { SectionBadge } from "@/components/ui/section-badge";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.frontmatter.title} — PsychMind`,
    description: post.frontmatter.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const { frontmatter, content } = post;
  // Two more reads: same category first, then the newest of the rest.
  const more = getAllPosts()
    .filter((p) => p.slug !== slug)
    .sort((a, b) => Number(b.category === frontmatter.category) - Number(a.category === frontmatter.category))
    .slice(0, 2);

  return (
    <article className="flex w-full flex-col pb-20 sm:pb-28 md:pb-32">
      <ReadingProgress />
      <Section spacing="none" className="pt-6 pb-10 sm:pt-12 sm:pb-14">
        <Reveal trigger="load" className="mx-auto flex max-w-[760px] flex-col items-center gap-5 text-center">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 rounded-pill py-1 pr-3 pl-2 type-small font-medium text-text-tertiary transition-colors hover:bg-warm-100 hover:text-text-primary"
          >
            <ChevronRightIcon className="size-3.5 rotate-180 transition-[translate] duration-300 ease-out-soft group-hover:-translate-x-0.5" />
            Resource center
          </Link>
          <h1 className="type-display text-balance text-text-primary">{frontmatter.title}</h1>
          <div className="flex flex-col items-center gap-2">
            <PostMeta category={frontmatter.category} author={frontmatter.author} />
            <p className="type-small text-text-placeholder">
              {frontmatter.readTime} · {frontmatter.date}
            </p>
          </div>
        </Reveal>
      </Section>

      {(frontmatter.heroImage || frontmatter.art) && (
        <Section spacing="none" className="pb-12 sm:pb-16">
          <Reveal trigger="load" delay={250} className="mx-auto w-full max-w-[1080px]">
            <ArticleArt image={frontmatter.heroImage} art={frontmatter.art} />
          </Reveal>
        </Section>
      )}

      <Section spacing="none">
        <Container
          size="prose"
          data-article-body
          className="flex flex-col items-start gap-6 type-body-lg text-text-tertiary [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a:hover]:text-text-primary [&_strong]:font-medium [&_strong]:text-text-primary"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 className="pt-6 type-h4 text-text-primary first:pt-0">{children}</h2>
              ),
              p: ({ children }) => <p>{children}</p>,
              ul: ({ children }) => <ul className="flex list-disc flex-col gap-1.5 pl-6">{children}</ul>,
              ol: ({ children }) => <ol className="flex list-decimal flex-col gap-1.5 pl-6">{children}</ol>,
              li: ({ children }) => <li className="pl-1 marker:text-warm-600/60">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="flex flex-col gap-2 border-l-2 border-brand-primary py-1 pl-5 [&>p:first-child]:type-h4 [&>p:first-child]:text-text-primary [&>p:last-child]:type-body [&>p:last-child]:text-text-tertiary">
                  {children}
                </blockquote>
              ),
              img: ({ src, alt }) => (
                <span className="flex w-full flex-col gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={typeof src === "string" ? src : undefined}
                    alt={alt || ""}
                    className="w-full rounded-card object-cover"
                  />
                  {alt && <span className="type-small text-text-tertiary">{alt}</span>}
                </span>
              ),
            }}
          >
            {content}
          </ReactMarkdown>

          <div className="mt-6 w-full">
            <AuthorBar
              name={frontmatter.author}
              role={frontmatter.authorTitle}
              avatar={
                frontmatter.authorAvatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={frontmatter.authorAvatar}
                    alt=""
                    className="size-12 shrink-0 rounded-full object-cover ring-1 ring-black/[0.06]"
                  />
                )
              }
            />
          </div>
        </Container>
      </Section>

      {more.length > 0 && (
        <Section spacing="none" className="pt-20 sm:pt-28">
          <Container className="flex flex-col gap-8 sm:gap-10">
            <Reveal className="flex items-center justify-between gap-6">
              <SectionBadge icon="/images/home/resource-badge-icon.svg">Resource center</SectionBadge>
              <Button asChild size="lg">
                <Link href="/blog">
                  Blogs
                  <CircleArrowIcon />
                </Link>
              </Button>
            </Reveal>
            <Reveal stagger className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              {more.map((p) => (
                <BlogCard
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  image={p.thumbnail}
                  category={p.category}
                  author={p.author}
                  title={p.title}
                  meta={`${p.readTime} · ${p.date}`}
                />
              ))}
            </Reveal>
          </Container>
        </Section>
      )}
    </article>
  );
}
