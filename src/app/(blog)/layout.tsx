import { SiteHeader } from "@/components/site-header";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

// The blog index: the public site's type, buttons and smooth scroll, as
// (site)/layout.tsx, but its header in the blog's variant (Go back and Subscribe in
// place of Log in and Create account) and no footer: the list scrolls on until the
// shore at its end, as theboringblog.ai's does, and the menu goes everywhere else.
export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="type-scope-sort site-ui contents">
      <SmoothScroll />
      <SiteHeader variant="blog" />
      <main className="flex-1">{children}</main>
    </div>
  );
}
