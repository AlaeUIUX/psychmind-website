import { cn } from "cn";
import Link from "next/link";
import { SplitHeading } from "@/components/motion/split-heading";
import { FooterScene } from "@/components/footer-scene";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Container, GUTTER } from "@/components/ui/section";
import { SocialLinks } from "@/components/shared/social-links";
import { CtaArrowIcon } from "@/components/ui/hugeicons";

// The site's foot, after Interfere's (interfere.com/product/engineers) on our
// light paper and in our type (no glow: nothing tints it): a centred call to action, the
// socials, a hairline, four columns of links with the mark at their end, the
// copyright, and under it, where Interfere signs off with its name, the hero's
// boat at sea up close, the page's full width (footer-scene.tsx).
// Interfere's measures, in our type: 13px headings and links (the nav's
// size), 12px for the fine print.

// TODO(client): the column headings and "Follow us on" are new copy ("Follow PsychMind
// on" ran too long on phones; owner, 2026-10-28), and "For providers" (the provider band's
// overline, as the link to How it works for providers).
const columns = [
  {
    title: "Explore",
    links: [
      { href: "/providers", label: "Browse providers" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/how-it-works/providers", label: "For providers" },
      { href: "/mission", label: "Mission" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Usage" },
      { href: "/cookie-policy", label: "Cookie Policy" },
      // The DMCA agent's details must be reachable from the site. TODO(client): label.
      { href: "/copyright", label: "Copyright Policy" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Create account" },
    ],
  },
];

/** `quiet`: no call to action and no socials, for pages where you're already
 *  searching (the directory); the links, copyright and sea stay. */
export function SiteFooter({ quiet = false }: { quiet?: boolean }) {
  return (
    <footer className={`relative w-full overflow-hidden border-t border-warm-200/70 bg-warm-25 ${GUTTER}`}>
      <Container className="relative">
        {/* The call to action, in the hero's type, then the socials. */}
        {!quiet && (
          <>
            <div className="flex flex-col items-center gap-4 pt-24 pb-28 text-center sm:pt-32 sm:pb-36">
              <SplitHeading delay={0.1} className="type-display text-text-primary">
                Ready to find help?
              </SplitHeading>
              <Reveal delay={260}>
                <p className="type-hero-lede">It takes less than two minutes. No referral needed</p>
              </Reveal>
              <Reveal delay={360} className="mt-4 flex flex-wrap justify-center gap-2">
                <Button asChild size="lg">
                  <Link href="/providers">
                    Browse all
                    <CtaArrowIcon />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/signup">Create account</Link>
                </Button>
              </Reveal>
            </div>

            <div className="flex items-center gap-3 pb-8">
              <p className="text-[15px] text-warm-500">Follow us on</p>
              <SocialLinks />
            </div>
          </>
        )}

        <div className={cn("flex items-start justify-between gap-10 pb-16 sm:pb-24", quiet ? "pt-12 sm:pt-16" : "border-t border-warm-200 pt-12 sm:pt-16")}>
          <nav aria-label="Footer" className="grid flex-1 grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[13px] leading-5 font-medium text-warm-900">{col.title}</p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-[13px] leading-5 text-warm-500 transition-colors duration-200 hover:text-warm-900">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/home/logo.svg" alt="" width={20} height={20} className="hidden size-5 sm:block" />
        </div>

        <div className="border-t border-warm-200 pt-8">
          <p className="text-xs leading-4 text-warm-500 tabular-nums">© {new Date().getFullYear()} PsychMind. All rights reserved.</p>
        </div>
      </Container>

      {/* the voyage, up close, the page's full width (out past the gutter) */}
      <div className="-mx-4 mt-6 sm:-mx-8 lg:-mx-12">
        <FooterScene />
      </div>
    </footer>
  );
}
