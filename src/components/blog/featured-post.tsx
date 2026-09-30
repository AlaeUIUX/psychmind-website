import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/blog";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { SectionBadge } from "@/components/ui/section-badge";

// One responsive layout: stacked and centered on phones, text-left /
// illustration-right from `sm` up. Only the illustration is art-directed
// (Figma exports a square crop for mobile).
export function FeaturedPost({ post }: { post: Post }) {
  return (
    <Reveal className="w-full">
      <div className="group flex w-full flex-col items-center gap-6 rounded-card surface-soft p-6 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:p-12 sm:text-left">
        <div className="flex flex-col items-center gap-6 sm:items-start sm:gap-10">
          <div className="flex flex-col items-center gap-5 sm:items-start">
            <SectionBadge icon="/images/blog/featured-badge-icon.svg">Featured blog</SectionBadge>
            <div className="relative size-[172px] shrink-0 sm:hidden">
              <Image src="/images/blog/featured-illustration-mobile.png" alt="" fill className="object-contain" />
            </div>
            <h2 className="type-h2 text-text-primary">{post.title}</h2>
          </div>
          <Button asChild size="lg">
            <Link href={`/blog/${post.slug}`}>
              Read more
              <CircleArrowIcon />
            </Link>
          </Button>
        </div>
        <div className="relative hidden h-[160px] w-[300px] shrink-0 sm:block">
          <Image
            src="/images/blog/featured-illustration.png"
            alt=""
            fill
            className="object-contain transition-[scale] duration-700 ease-out-soft group-hover:scale-[1.04]"
          />
        </div>
      </div>
    </Reveal>
  );
}
