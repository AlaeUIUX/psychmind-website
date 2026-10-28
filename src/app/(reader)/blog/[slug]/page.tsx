import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { postNumber } from "@/lib/blog-format";
import { Beat, Reader, type ReaderPart } from "@/components/blog/reader";
import { AuthorBar } from "@/components/shared/author-bar";
import { CtaArrowIcon } from "@/components/ui/hugeicons";
import { getPostBySlug, getPostIndex } from "@/lib/blog";

// A post, after theboringblog.ai's: a title screen (its number and year, the title, its
// line, who wrote it and how long), then each of its parts (its ## sections) a screen
// of its own, counted, the page snapping from one to the next, and at the end who
// wrote it, the next post, and the way back. No pictures but the ones in the text.

export function generateStaticParams() {
  return getPostIndex().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.frontmatter.title} — PsychMind`,
    description: post.frontmatter.excerpt,
  };
}

/** The post's ## sections, each with its heading and text (anything before the first
 *  heading opens the first one). */
function splitParts(content: string) {
  const parts: { name: string; body: string }[] = [];
  let lead = "";
  for (const line of content.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) parts.push({ name: heading[1], body: parts.length ? "" : lead });
    else if (parts.length) parts[parts.length - 1].body += `${line}\n`;
    else lead += `${line}\n`;
  }
  if (!parts.length && lead.trim()) parts.push({ name: "The post", body: lead });
  return parts;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const markdown: Components = {
  p: ({ children }) => <p>{children}</p>,
  h3: ({ children }) => <h3 className="pt-2 type-title text-text-primary">{children}</h3>,
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
      <img src={typeof src === "string" ? src : undefined} alt={alt || ""} className="w-full rounded-card object-cover" />
      {alt && <span className="type-small text-text-tertiary">{alt}</span>}
    </span>
  ),
};

const prose =
  "mt-6 flex flex-col gap-5 type-body-lg text-text-tertiary [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a:hover]:text-text-primary [&_strong]:font-medium [&_strong]:text-text-primary";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const index = getPostIndex();
  const me = index.find((p) => p.slug === slug)!;
  // the next post: the one after it, or back round to the first
  const next = index.find((p) => p.number === me.number + 1) ?? index.find((p) => p.number === 1);
  const { frontmatter } = post;
  const parts = splitParts(post.content);
  const ids = parts.map((p, i) => slugify(p.name) || `part-${i + 1}`);
  const rail: ReaderPart[] = [{ id: "start", name: "Start" }, ...parts.map((p, i) => ({ id: ids[i], name: p.name }))];
  const count = (i: number) => `${String(i + 1).padStart(2, "0")} / ${String(parts.length).padStart(2, "0")}`;

  return (
    <Reader parts={rail}>
      {/* the title screen */}
      <Beat id="start" className="flex flex-col justify-center pt-24 pb-24">
        <p className="type-overline text-text-tertiary">
          {frontmatter.category} · No. {postNumber(me.number)} — {me.year}
        </p>
        <h1 className="type-hero-title mt-5 text-balance">{frontmatter.title}</h1>
        <p className="type-lead mt-6 text-text-tertiary">{frontmatter.excerpt}</p>
        <p className="type-small mt-6 text-text-placeholder">
          By <span className="text-text-secondary">{frontmatter.author}</span> · {frontmatter.date} · {frontmatter.readTime} ·{" "}
          {parts.length} {parts.length === 1 ? "part" : "parts"}
        </p>
        {/* TODO(client): new microcopy */}
        <p aria-hidden className="type-overline absolute inset-x-0 bottom-10 text-center text-text-placeholder">
          Scroll
        </p>
      </Beat>

      {parts.map((part, i) => (
        <Beat key={ids[i]} id={ids[i]}>
          <p className="type-overline text-text-placeholder">{count(i)}</p>
          <h2 className="type-h2 mt-4 text-text-primary">{part.name}</h2>
          <div className={prose}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdown}>
              {part.body}
            </ReactMarkdown>
          </div>
          {/* the last part ends with who wrote it, the next post and the way back */}
          {i === parts.length - 1 && (
            <div className="mt-16 flex flex-col gap-10">
              <AuthorBar
                name={frontmatter.author}
                role={frontmatter.authorTitle}
                avatar={
                  frontmatter.authorAvatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={frontmatter.authorAvatar} alt="" className="size-12 shrink-0 rounded-full object-cover ring-1 ring-black/[0.06]" />
                  )
                }
              />
              {next && next.slug !== slug && (
                <Link
                  href={`/blog/${next.slug}`}
                  className="group flex items-center justify-between gap-6 border-t border-warm-200 pt-6"
                >
                  <span className="flex items-center gap-2 type-reader-entry text-text-primary">
                    {next.title}
                    <CtaArrowIcon className="size-4 shrink-0" />
                  </span>
                  {/* TODO(client): new microcopy */}
                  <span className="type-overline shrink-0 text-text-placeholder">Next</span>
                </Link>
              )}
              <p className="type-small text-text-tertiary">
                If you need to talk, the{" "}
                <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-text-primary">
                  988 Lifeline
                </a>{" "}
                is here
              </p>
            </div>
          )}
        </Beat>
      ))}
    </Reader>
  );
}
