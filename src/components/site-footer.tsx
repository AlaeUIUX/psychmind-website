import Image from "next/image";
import Link from "next/link";

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

export function SiteFooter() {
  // Figma bleeds one continuous sheet of lined paper across the whole footer
  // (CTA banner + links + copyright), not just the CTA card. Using the real
  // exported paper photo (not a CSS approximation) tiled down a contained,
  // page-shaped card — the shared .paper-bg gradient pattern is correct for
  // the smaller frames it's used on (smart search, mission quote) but doesn't
  // match this specific texture/scale.
  return (
    <footer className="w-full flex flex-col items-center py-16 sm:py-24 md:py-32 px-4 sm:px-8">
      <div className="w-full max-w-[1056px] rounded-[20px] overflow-hidden bg-warm-25 bg-[url('/images/home/footer-bg.png')] bg-left-top bg-repeat-y [background-size:100%_auto] flex flex-col items-center gap-12 pb-12 sm:pb-14">
        <div className="w-full p-2 sm:p-6">
          <div className="relative w-full overflow-hidden rounded-[20px] bg-black/[0.045] px-6 py-10 sm:px-16 sm:py-14 md:min-h-[380px] lg:min-h-[420px]">
            <div className="relative z-10 flex flex-col items-start gap-2 max-w-[380px]">
              <h2 className="font-display-alt text-text-primary text-display-md">
                Ready to find help?
              </h2>
              <p className="text-text-secondary text-xl pb-4">
                It takes less than two minutes. No referral needed
              </p>
              <Link
                href="/providers"
                className="inline-flex items-center gap-3 rounded-pill bg-warm-900 px-6 py-3 text-xl font-medium text-white hover:bg-warm-800 transition-colors"
              >
                Browse all
                <img src="/images/home/footer-arrow.svg" alt="" width={24} height={24} />
              </Link>
            </div>
            <div className="hidden md:block absolute -top-8 right-[-40px] w-[480px] h-[320px] lg:w-[600px] lg:h-[400px] lg:right-[-30px]">
              <Image
                src="/images/home/footer-illustration.png"
                alt=""
                fill
                className="object-contain object-right-bottom"
              />
            </div>
          </div>
        </div>

        <div className="w-full max-w-[794px] px-4 flex flex-col gap-10">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-10">
            <div className="flex gap-5">
              <ul className="flex flex-col gap-5 w-[184px]">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[rgba(25,25,25,0.8)] hover:text-text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-5 w-[184px]">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[rgba(25,25,25,0.8)] hover:text-text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3">
              <Link href="/login" className="rounded-pill px-3 py-1.5 text-xs font-semibold text-text-primary">
                Log in
              </Link>
              <Link href="/signup" className="rounded-pill bg-warm-800 px-3 py-1.5 text-xs font-semibold text-white">
                Create account
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/images/home/logo.svg" alt="PsychMind" width={32} height={32} />
              <span className="text-[rgba(25,25,25,0.5)]">
                © {new Date().getFullYear()} PsychMind. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-5">
              {socials.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label}>
                  <img src={social.src} alt="" width={24} height={24} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

