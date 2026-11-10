import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COVER_ART, type CoverArt } from "@/components/blog/cover-spots";
import { PostCover } from "@/components/blog/post-cover";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = { title: "Covers — PsychMind", robots: { index: false } };

// The blog's covers (components/blog/post-cover.tsx), each drawing at the sizes it
// shows (always 16:9): a card in the home page's Resource center grid, and a post's
// hero. The posts using each are listed under it. Hidden on the production site.

const SIZES = [
  { label: "Card", className: "w-[340px]" },
  { label: "Post hero", className: "w-[600px]" },
];

export default function DevCoversPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const posts = getAllPosts();
  return (
    <main className="flex flex-col gap-16 px-6 py-12">
      <header className="max-w-[640px]">
        <h1 className="type-display">Covers</h1>
        <p className="type-body mt-2 text-text-tertiary">
          One paper and one picture of what the post is about, nothing written on it. A post picks its picture with{" "}
          <code>cover:</code>; the girl&apos;s are drawn at <code>/dev/cover-studio</code>.
        </p>
      </header>
      {(Object.keys(COVER_ART) as CoverArt[]).map((name) => {
        const using = posts.filter((p) => p.cover === name);
        return (
          <section key={name} className="flex flex-col gap-4">
            <p className="type-small text-text-tertiary">
              <span className="font-medium text-text-primary">{name}</span> · {COVER_ART[name].label}
              {using.length > 0 && <> · {using.map((p) => p.slug).join(", ")}</>}
            </p>
            <div className="flex flex-wrap items-start gap-6">
              {SIZES.map((size) => (
                <figure key={size.label} className="flex flex-col gap-2">
                  <div className={`group relative overflow-hidden rounded-card ${size.className}`}>
                    <PostCover spot={name} />
                  </div>
                  <figcaption className="type-caption text-text-placeholder">{size.label}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
