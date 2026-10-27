import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The public site's type and buttons: Inter and STIX (type-scope-sort), and
  // the nav's buttons (.site-ui in globals.css). `contents` keeps the body's
  // flex column for the main.
  return (
    <div className="type-scope-sort site-ui contents">
      <SmoothScroll />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
