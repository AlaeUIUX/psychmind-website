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
  // Figma bleeds one oversized, rotated copy of the lined-paper texture across
  // the whole footer (CTA banner + links + copyright), not just the CTA card —
  // reproduced here with the shared .paper-bg pattern on the outer <footer>.
  return (
    <footer className="paper-bg w-full flex flex-col items-center gap-12 py-16 sm:py-24 md:py-32">
      <div className="w-full flex justify-center px-6 sm:px-12">
        <div className="relative w-full max-w-[1056px] overflow-hidden rounded-[20px] bg-black/[0.045] px-6 py-12 sm:px-16 sm:py-16">
          <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex flex-col items-start gap-2 max-w-[400px]">
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
            <div className="hidden md:block relative w-[300px] h-[280px] shrink-0">
              <Image
                src="/images/home/footer-illustration.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
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
    </footer>
  );
}
