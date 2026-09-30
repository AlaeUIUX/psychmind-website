import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

type BlogCardProps = {
  href: string;
  image?: string;
  category: string;
  author: string;
  title: string;
  /** e.g. "8 min read · March 2025" */
  meta: string;
};

/** Category · author row used on cards and article headers. */
export function PostMeta({ category, author }: { category: string; author: string }) {
  return (
    <div className="flex items-center gap-2.5 type-small text-text-tertiary">
      <span>{category}</span>
      <span aria-hidden className="size-[3px] rounded-full bg-warm-600/40" />
      <span>{author}</span>
    </div>
  );
}

// One card for every post preview (home + blog index). Hover lifts the card,
// eases the illustration forward and fills the arrow chip.
export function BlogCard({ href, image, category, author, title, meta }: BlogCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-5 rounded-card surface-soft p-4 transition-[translate,box-shadow] duration-500 ease-out-soft hover:-translate-y-1 hover:shadow-card sm:gap-6 sm:p-6"
    >
      <div className="relative flex aspect-[436/256] w-full items-center justify-center overflow-hidden rounded-field bg-blush-25">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 768px) 500px, 100vw"
            className="object-contain transition-[scale] duration-700 ease-out-soft group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/blog/psychmind-icon.svg" alt="" width={40} height={40} />
            <span className="font-display text-2xl text-warm-900">PsychMind</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 items-start gap-4 sm:gap-6">
        <div className="flex flex-1 flex-col gap-3">
          <PostMeta category={category} author={author} />
          <h3 className="type-title-lg text-text-primary">{title}</h3>
          <p className="type-small text-text-placeholder">{meta}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-warm-700 transition-colors duration-300 group-hover:bg-warm-900 group-hover:text-white">
          <ChevronRightIcon className="size-4 transition-[translate] duration-300 ease-out-soft group-hover:translate-x-px" />
        </span>
      </div>
    </Link>
  );
}
