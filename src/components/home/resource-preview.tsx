import Image from "next/image";
import Link from "next/link";

const posts = [
  {
    category: "Mental health",
    author: "Dr. Danny Schwelberg",
    title: "How to know when you're ready to start therapy — and what to expect",
    meta: "8 min read · March 2025",
    image: "/images/home/blog-thumb-1.png",
    slug: "ready-to-start-therapy",
  },
  {
    category: "Guide",
    author: "PsychMind Team",
    title: "CBT vs. psychodynamic therapy: which is right for you?",
    meta: "5 min read · Feb 2025",
    image: "/images/home/blog-thumb-2.png",
    slug: "cbt-vs-psychodynamic-therapy",
  },
  {
    category: "Wellness",
    author: "Dr. Sara Olisz",
    title: "Five signs that anxiety is affecting your daily life more than you think",
    meta: "4 min read · Jan 2025",
    image: "/images/home/blog-thumb-3-illustration.png",
    slug: "signs-anxiety-affecting-daily-life",
  },
  {
    category: "Design and Dev",
    author: "PsychMind Team",
    title: "How we designed PsychMind AI search tool in 6 months",
    meta: "12 min read · Jan 2025",
    image: "/images/home/blog-thumb-4.png",
    slug: "designing-psychmind-ai-search",
  },
];

export function ResourcePreview() {
  return (
    <section className="w-full flex flex-col items-center gap-12 px-4 sm:px-12 md:px-20 py-16 sm:py-24 md:py-32">
      <div className="w-full max-w-[1052px] flex flex-col gap-6">
        <span className="inline-flex w-fit items-center gap-3 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-[18px] py-2 text-lg font-medium">
          <img src="/images/home/resource-badge-icon.svg" alt="" width={32} height={32} />
          <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
            Resource center
          </span>
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-6">
            <h2 className="font-display text-warm-900 text-display-md tracking-[-0.46px]">
              Blogs from our fellow help providers
            </h2>
            <p className="text-warm-600 text-display-xs max-w-[624px]">
              Guides, insights, and perspectives on mental health — written by our experts
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-3 rounded-pill bg-warm-900 px-6 py-3 text-xl font-medium text-white shrink-0"
          >
            Blogs
          </Link>
        </div>
      </div>

      <div className="w-full max-w-[1052px] grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="flex flex-col gap-6 rounded-[20px] border border-black/[0.06] p-6 bg-gradient-to-br from-[#f6f6f6] via-[#f8f8f8] to-[#fcfcfc] hover:shadow-md transition-shadow"
          >
            <div className="relative w-full aspect-[436/256] rounded-[20px] overflow-hidden bg-[#fdf9f9]">
              <Image src={post.image} alt="" fill className="object-contain" />
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
                <p className="text-[14.8px] text-[rgba(27,37,64,0.64)]">{post.meta}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
