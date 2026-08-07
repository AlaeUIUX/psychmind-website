import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/blog";

export function FeaturedPost({ post }: { post: Post }) {
  return (
    <div className="w-full max-w-[1052px] rounded-[20px] border border-black/[0.06] bg-gradient-to-br from-[#f6f6f6] via-[#f8f8f8] to-[#fcfcfc] p-6 sm:p-12">
      {/* Mobile: badge, image, title, button stacked and centered.
          Desktop (sm+): text column on the left, image on the right. */}
      <div className="flex flex-col items-center gap-6 sm:hidden">
        <span className="inline-flex w-fit items-center gap-2 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-[18px] py-1 text-xs font-medium">
          <img src="/images/blog/featured-badge-icon-mobile.svg" alt="" width={24} height={24} />
          <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
            Featured blog
          </span>
        </span>
        <div className="relative size-[172px] shrink-0">
          <Image src="/images/blog/featured-illustration-mobile.png" alt="" fill className="object-contain" />
        </div>
        <h2 className="font-display text-warm-900 text-display-xs tracking-[-0.46px] text-center">
          {post.title}
        </h2>
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex w-full items-center justify-center gap-3 rounded-pill bg-warm-900 px-6 py-3 text-xl font-medium text-white hover:bg-warm-800 transition-colors"
        >
          Read more
          <img src="/images/blog/cta-arrow-icon.svg" alt="" width={24} height={24} />
        </Link>
      </div>

      <div className="hidden sm:flex items-center justify-between gap-8">
        <div className="flex flex-col items-start justify-between gap-10 self-stretch">
          <div className="flex flex-col gap-6">
            <span className="inline-flex items-center gap-3 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-[18px] py-2 text-lg font-medium">
              <img src="/images/blog/featured-badge-icon.svg" alt="" width={32} height={32} />
              <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
                Featured blog
              </span>
            </span>
            <h2 className="font-display text-warm-900 text-display-md tracking-[-0.46px]">
              {post.title}
            </h2>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-3 rounded-pill bg-warm-900 px-6 py-3 text-xl font-medium text-white hover:bg-warm-800 transition-colors"
          >
            Read more
            <img src="/images/blog/cta-arrow-icon.svg" alt="" width={24} height={24} />
          </Link>
        </div>
        <div className="relative w-[300px] h-[160px] shrink-0">
          <Image src="/images/blog/featured-illustration.png" alt="" fill className="object-contain" />
        </div>
      </div>
    </div>
  );
}
