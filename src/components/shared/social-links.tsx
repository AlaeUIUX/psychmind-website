// PsychMind's social accounts, as small framed icons (the footer's "Follow us on", and
// under the founders' signatures on the mission page).

// TODO(client): the accounts' addresses.
const socials = [
  { href: "#", label: "Instagram", src: "/images/home/social-instagram.svg" },
  { href: "#", label: "X (Twitter)", src: "/images/home/social-x.svg" },
  { href: "#", label: "LinkedIn", src: "/images/home/social-linkedin.svg" },
];

export function SocialLinks() {
  return (
    <ul className="flex gap-1.5">
      {socials.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            aria-label={s.label}
            className="flex size-8 items-center justify-center rounded-[8px] border border-warm-200 bg-white transition-colors duration-200 hover:border-warm-300 hover:bg-warm-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt="" width={16} height={16} className="size-4 opacity-80" />
          </a>
        </li>
      ))}
    </ul>
  );
}
