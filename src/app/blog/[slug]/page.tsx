import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { ShareButtons } from "@/components/shared/share-buttons";

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
    <article className="w-full flex flex-col items-center gap-12 sm:gap-16 pb-20 sm:pb-32 md:pb-40">
      <div className="w-full flex flex-col items-center gap-4 max-w-[720px] px-4 sm:px-8 pt-6 sm:pt-16 text-center">
        <p className="text-warm-600 text-lg sm:text-display-xs">
          {frontmatter.readTime} · {frontmatter.date}
        </p>
        <h1 className="font-display text-warm-900 text-[36px] sm:text-[48px] md:text-display-lg leading-[1.1] md:leading-[60px]">
          {frontmatter.title}
        </h1>
        <div className="flex items-center gap-3 text-lg sm:text-display-xs">
          <span className="text-warm-600">{frontmatter.category}</span>
          <span className="size-[3px] shrink-0 rounded-full bg-[rgba(21,40,68,0.1)]" />
          <span className="font-medium text-brand-primary">{frontmatter.author}</span>
        </div>
      </div>

      {frontmatter.heroImage && (
        <div className="w-full max-w-[1440px] px-4 sm:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frontmatter.heroImage}
            alt=""
            className="w-full max-h-[521px] rounded-[20px] object-contain"
          />
        </div>
      )}

      <div className="w-full max-w-[720px] px-4 sm:px-8 flex flex-col items-start gap-6 text-lg leading-[28px] text-text-tertiary [&_strong]:font-medium [&_strong]:text-warm-900 [&_a]:underline [&_a:hover]:text-warm-900 [&_a]:transition-colors">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 className="font-['Geist:SemiBold'] font-semibold text-warm-900 text-display-xs pt-8 pb-2 first:pt-0">
                {children}
              </h2>
            ),
            p: ({ children }) => <p className="leading-[28px]">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc pl-[27px] flex flex-col gap-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-[27px] flex flex-col gap-1">{children}</ol>
            ),
            li: ({ children }) => <li className="leading-[28px]">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="flex flex-col gap-2 border-l-2 border-warm-300 pl-5 py-2 [&>p:first-child]:font-medium [&>p:first-child]:text-display-xs [&>p:first-child]:leading-[32px] [&>p:first-child]:text-warm-900 [&>p:last-child]:text-md [&>p:last-child]:leading-6 [&>p:last-child]:text-text-tertiary">
                {children}
              </blockquote>
            ),
            img: ({ src, alt }) => (
              <span className="flex flex-col gap-1.5 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={typeof src === "string" ? src : undefined}
                  alt={alt || ""}
                  className="w-full rounded-[20px] object-cover"
                />
                {alt && <span className="text-sm text-text-tertiary">{alt}</span>}
              </span>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      <div className="w-full max-w-[720px] px-4 sm:px-8 flex flex-wrap items-start justify-between gap-y-6 border-t border-warm-200 pt-6">
        <div className="flex items-center gap-3">
          {frontmatter.authorAvatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={frontmatter.authorAvatar}
              alt=""
              className="size-12 shrink-0 rounded-full object-cover"
            />
          )}
          <div className="flex flex-col text-md leading-6">
            <span className="font-semibold text-warm-900">{frontmatter.author}</span>
            {frontmatter.authorTitle && (
              <span className="text-text-tertiary">{frontmatter.authorTitle}</span>
            )}
          </div>
        </div>
        <ShareButtons />
      </div>
    </article>
  );
}
