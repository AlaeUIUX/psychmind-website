import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { CircleArrowIcon } from "@/components/ui/icons";
import { GUTTER } from "@/components/ui/section";

const productLinks = [
  { href: "/providers", label: "Browse providers" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Usage" },
  { href: "/cookie-policy", label: "Cookie Policy" },
];

const socials = [
  { href: "#", label: "Instagram", src: "/images/home/social-instagram.svg" },
  { href: "#", label: "X (Twitter)", src: "/images/home/social-x.svg" },
  { href: "#", label: "YouTube", src: "/images/home/social-youtube.svg" },
  { href: "#", label: "LinkedIn", src: "/images/home/social-linkedin.svg" },
];

function FooterLinks({ links }: { links: typeof productLinks }) {
  return (
    <ul className="flex min-w-0 flex-1 flex-col gap-1 sm:w-[184px] sm:flex-none">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="inline-flex h-9 items-center type-body text-text-secondary transition-colors hover:text-text-primary"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter() {
  // Figma layers two separate shapes here, not one: a wide, short gray card
  // sized to just the CTA row (peeking out left/right), behind a narrower but
  // much taller sheet of real lined paper that runs uninterrupted through the
  // CTA, links, and copyright rows. The shared .paper-bg gradient pattern is
  // correct for the smaller frames it's used on (smart search, mission quote)
  // but doesn't match this texture/scale, so this uses the real exported photo.
  return (
    <footer className={`flex w-full flex-col items-center py-16 sm:py-24 md:py-32 ${GUTTER}`}>
      <div className="relative flex w-full max-w-[1056px] flex-col items-center">
        <div className="absolute inset-x-0 top-0 h-[420px] rounded-card bg-warm-200/40 sm:h-[460px] md:h-[500px]" />

        {/* Purely decorative: the paper sheet bleeds above the gray card's top
            edge and past the content's bottom edge, independent of the actual
            content layout below (Figma positions its text absolutely too, at
            a fixed offset, rather than nesting it inside the paper). */}
        <div
          aria-hidden
          className="absolute -top-[120px] -bottom-[24px] left-1/2 w-full max-w-[900px] -translate-x-1/2 rounded-card bg-warm-25 bg-[url('/images/home/footer-paper-bg.png')] [background-size:100%_auto] bg-left-top bg-repeat-y shadow-card"
        />

        <div className="relative z-10 flex w-full max-w-[900px] flex-col items-center gap-12 pb-12 sm:pb-14">
          <div className="relative w-full px-6 py-10 sm:px-16 sm:py-14 md:min-h-[420px] lg:min-h-[480px]">
            <Reveal
              stagger
              className="relative z-10 mx-auto flex max-w-[360px] flex-col items-center gap-3 text-center md:mx-0 md:items-start md:text-left"
            >
              <h2 className="type-h2 font-display-alt! text-text-primary">Ready to find help?</h2>
              <p className="type-lead text-text-secondary">
                It takes less than two minutes. No referral needed
              </p>
              <Button asChild size="lg" className="mt-4">
                <Link href="/providers">
                  Browse all
                  <CircleArrowIcon />
                </Link>
              </Button>
            </Reveal>
            {/* Exported directly from the illustration's own Figma layer
                (146:9033) at its native 700x466 ratio. */}
            <Reveal
              delay={200}
              className="pointer-events-none absolute -top-2 right-[-8px] hidden h-[240px] w-[360px] md:block lg:h-[306px] lg:w-[460px] xl:h-[346px] xl:w-[520px]"
            >
              <Image
                src="/images/home/footer-illustration-clean.png"
                alt=""
                fill
                sizes="520px"
                className="animate-float object-contain object-right-bottom"
              />
            </Reveal>
          </div>

          {/* The paper texture's red margin line sits at a fixed ~3% of the paper's
              width, which itself scales with viewport — a fixed px padding here
              would clear it at one width and fall short at another. Percentage
              padding tracks the line proportionally at every size instead. */}
          <div className="flex w-full max-w-[794px] flex-col gap-10 px-[7%]">
            <div className="flex flex-col items-start justify-between gap-10 sm:flex-row">
              <nav aria-label="Footer" className="flex w-full gap-5 sm:w-auto">
                <FooterLinks links={productLinks} />
                <FooterLinks links={legalLinks} />
              </nav>
              <div className="hidden gap-2 md:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Create account</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col-reverse items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <img src="/images/home/logo.svg" alt="" width={28} height={28} />
                <span className="type-small text-text-placeholder">
                  © {new Date().getFullYear()} PsychMind. All rights reserved.
                </span>
              </div>
              <div className="-ml-2 flex items-center gap-1 sm:ml-0 sm:-mr-2">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex size-10 items-center justify-center rounded-full opacity-80 transition-[background-color,opacity] hover:bg-warm-100 hover:opacity-100"
                  >
                    <img src={social.src} alt="" width={20} height={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
