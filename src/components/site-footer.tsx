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

// The notepad rules are 32px apart (.paper-ruled). Every line of footer text
// gets a 32px line box, nudged down so its baseline rests on the rule.
const ON_RULE = "leading-8 translate-y-[8px]";

function FooterLinks({ links }: { links: typeof productLinks }) {
  return (
    <ul className="flex min-w-0 flex-1 flex-col sm:w-[184px] sm:flex-none">
      {links.map((link) => (
        <li key={link.label} className="h-8">
          <Link
            href={link.href}
            className={`inline-block text-[15px] font-medium tracking-[-0.005em] text-text-secondary transition-colors hover:text-text-primary ${ON_RULE}`}
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
  // much taller sheet of lined paper that runs uninterrupted through the CTA,
  // links, and copyright rows. The rules (.paper-ruled) sit on a fixed 32px
  // pitch anchored to the sheet's bottom edge, and everything inside is laid
  // out in whole 32px rows, so each line of text rests on a rule.
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
          className="paper-ruled absolute -top-[120px] -bottom-[32px] left-1/2 w-full max-w-[900px] -translate-x-1/2 rounded-card shadow-card"
        />

        <div className="relative z-10 flex w-full max-w-[900px] flex-col items-center gap-16 pb-8">
          <div className="relative w-full px-6 pt-16 pb-8 sm:px-16 md:min-h-[416px] lg:min-h-[480px]">
            <Reveal
              stagger
              className="relative z-10 mx-auto flex max-w-[380px] flex-col items-center text-center md:mx-0 md:items-start md:text-left"
            >
              <h2 className="type-h2 font-display-alt! leading-8! text-text-primary">Ready to find help?</h2>
              <p className="type-lead leading-8! translate-y-[5px] text-text-secondary">
                It takes less than two minutes. No referral needed
              </p>
              <div className="mt-8 flex h-16 items-center">
                <Button asChild size="lg">
                  <Link href="/providers">
                    Browse all
                    <CircleArrowIcon />
                  </Link>
                </Button>
              </div>
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

          {/* Percentage padding keeps the text clear of the pink margin line,
              which sits at ~3.5% of the sheet's width. */}
          <div className="flex w-full max-w-[794px] flex-col gap-8 px-[7%]">
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

            <div className="flex flex-col-reverse items-start justify-between sm:h-8 sm:flex-row sm:items-center">
              <div className="flex h-8 items-center gap-2.5">
                <img src="/images/home/logo.svg" alt="" width={24} height={24} className="translate-y-[2px]" />
                <span className={`text-sm text-text-tertiary tabular-nums ${ON_RULE}`}>
                  © {new Date().getFullYear()} PsychMind. All rights reserved.
                </span>
              </div>
              <div className="-ml-2 flex h-16 items-center gap-1 sm:-mr-2 sm:ml-0 sm:h-8">
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
