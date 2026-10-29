import type { Metadata } from "next";
import { EditorialNote } from "@/components/blog/editorial-note";
import { PostIndex } from "@/components/blog/post-index";
import { ShoreScene } from "@/components/blog/shore-scene";
import { SiteFooter } from "@/components/site-footer";
import { getPostIndex } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Resource center — PsychMind",
  description: "Guides, insights, and perspectives on mental health — written by your providers.",
};

// After theboringblog.ai/posts: a plain heading (the home hero's title size), whose
// posts and which category, the posts by year, growing as you scroll, and the shore
// along the foot of the screen, the list scrolling over it until it settles at the
// end, with no footer (the menu goes everywhere else). That's on computers; phones
// end with the site's footer instead (owner, 2026-10-28).
export default function BlogPage() {
  const posts = getPostIndex();
  return (
    <>
      <section className="px-6 pt-10 pb-16 sm:pt-16">
        <div className="mx-auto grid w-full max-w-[600px] lg:max-w-[820px] lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-x-12">
          <header className="lg:col-start-2">
            {/* TODO(client): new copy, the overline */}
            <p className="type-overline text-text-tertiary">Everything, newest first</p>
            <h1 className="type-hero-title mt-4">Resource center</h1>
            <p className="type-body mt-4 text-text-tertiary">
              Guides, insights, and perspectives on mental health — written by your providers
            </p>
          </header>
          <PostIndex posts={posts} />
          <EditorialNote className="mt-16 lg:col-span-2" />
        </div>
      </section>
      <ShoreScene />
      <div className="lg:hidden">
        <SiteFooter />
      </div>
    </>
  );
}
