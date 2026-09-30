import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { Reveal } from "@/components/reveal";
import { AuthorBar } from "@/components/shared/author-bar";
import { Container, Section } from "@/components/ui/section";

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

  return (
    <article className="flex w-full flex-col pb-20 sm:pb-28 md:pb-32">
      <Section spacing="none" className="pt-6 pb-10 sm:pt-12 sm:pb-14">
        <Reveal trigger="load" className="mx-auto flex max-w-[720px] flex-col items-center gap-4 text-center">
          <p className="type-lead text-text-tertiary">
            {frontmatter.readTime} · {frontmatter.date}
          </p>
          <h1 className="type-display text-text-primary">{frontmatter.title}</h1>
          <div className="flex items-center gap-3 type-lead">
            <span className="text-text-tertiary">{frontmatter.category}</span>
            <span aria-hidden className="size-1 shrink-0 rounded-full bg-warm-600/40" />
            <span className="font-medium text-brand-primary">{frontmatter.author}</span>
          </div>
        </Reveal>
      </Section>

      {frontmatter.heroImage && (
        <Section spacing="none" className="pb-12 sm:pb-16">
          <Reveal trigger="load" delay={250} className="mx-auto w-full max-w-[1240px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frontmatter.heroImage}
              alt=""
              className="max-h-[521px] w-full rounded-card object-contain"
            />
          </Reveal>
        </Section>
      )}

      <Section spacing="none">
        <Container
          size="prose"
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
    </article>
  );
}
