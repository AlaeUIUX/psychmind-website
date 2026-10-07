import Link from "next/link";
import type { Post } from "@/lib/blog";
import { Reveal } from "@/components/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { SectionBadge } from "@/components/ui/section-badge";
import { PostMeta } from "./blog-card";
import { FeaturedArt } from "./featured-art";

// One responsive layout: stacked and centered on phones, text-left /
// illustration-right from `sm` up. The whole card is the link target; the
// button is its visible affordance.
export function FeaturedPost({ post }: { post: Post }) {
  return (
    <Reveal className="w-full">
      <Link
        href={`/blog/${post.slug}`}
        className="group grain relative flex w-full flex-col items-center gap-6 overflow-hidden rounded-card surface-soft p-6 text-center transition-shadow duration-500 ease-out-soft hover:shadow-card sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:p-12 sm:text-left"
      >
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-[420px] rounded-full bg-brand-soft/80 blur-[80px]" />
        <div className="relative flex flex-col items-center gap-6 sm:items-start sm:gap-10">
          <div className="flex flex-col items-center gap-5 sm:items-start">
            <SectionBadge icon="/images/blog/featured-badge-icon.svg">Featured blog</SectionBadge>
            <div className="sm:hidden">
              <FeaturedArt />
            </div>
            <SplitHeading className="type-h2 max-w-[560px] text-text-primary">{post.title}</SplitHeading>
            <div className="flex flex-col items-center gap-1.5 sm:items-start">
              <PostMeta category={post.category} author={post.author} />
              <p className="type-small text-text-placeholder">
                {post.readTime} · {post.date}
              </p>
            </div>
          </div>
          <Button asChild size="lg">
            <span>
              Read more
              <CircleArrowIcon className="transition-[rotate] duration-500 ease-out-soft group-hover:rotate-45" />
            </span>
          </Button>
        </div>
        <div className="relative hidden sm:block">
          <FeaturedArt />
        </div>
      </Link>
    </Reveal>
  );
}
