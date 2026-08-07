import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/blog";

export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="w-full max-w-[1052px] grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="flex flex-col gap-6 rounded-[20px] border border-black/[0.06] p-6 bg-gradient-to-br from-[#f6f6f6] via-[#f8f8f8] to-[#fcfcfc] hover:shadow-md transition-shadow"
        >
          <div className="relative w-full aspect-[436/256] rounded-[20px] overflow-hidden bg-[#fdf9f9] flex items-center justify-center">
            {post.thumbnail ? (
              <Image src={post.thumbnail} alt="" fill className="object-contain" />
            ) : (
              <div className="flex items-center gap-3">
                <img src="/images/blog/psychmind-icon.svg" alt="" width={40} height={40} />
                <span className="font-display text-2xl text-warm-900">PsychMind</span>
              </div>
            )}
          </div>
          <div className="flex gap-6 items-start">
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm text-text-tertiary">
                <span>{post.category}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-[rgba(21,40,68,0.1)]" />
                <span>{post.author}</span>
              </div>
              <h3 className="text-2xl font-medium text-warm-900 tracking-[-0.28px]">
                {post.title}
              </h3>
              <p className="text-[14.8px] text-[rgba(27,37,64,0.64)]">
                {post.readTime} · {post.date}
              </p>
            </div>
            <span className="flex items-center justify-center rounded-full bg-black/[0.06] p-3 shrink-0">
              <img src="/images/blog/card-arrow-icon.svg" alt="" width={16} height={16} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
