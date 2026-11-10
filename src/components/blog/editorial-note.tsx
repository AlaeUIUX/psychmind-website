import { cn } from "cn";
import { Reveal } from "@/components/reveal";
import { BadgeCheckIcon, InfoIcon, PhoneIcon } from "@/components/ui/hugeicons";

// A short, honest note on what the resource center is — and isn't — shown under
// article lists. TODO(client): confirm the authorship line.
//
// Drawn as the landing's privacy promise is (home/verified-providers.tsx), so it's
// a piece the site already has: a thin grey frame round one white card, each line
// a medium title over a softer one, hairlines between. No icon at rest; hovered,
// the icon fades in and the text steps aside for it (owner, 2026-11-10: the old
// three tiles with round icons matched nothing else on the site).
const items = [
  {
    title: "Written by people who do the work",
    body: "Articles come from providers on PsychMind and our own team.",
    Icon: BadgeCheckIcon,
  },
  {
    title: "Information, not a diagnosis",
    body: "Reading is a good first step, but it's never a substitute for care from a professional.",
    Icon: InfoIcon,
  },
  {
    title: "In crisis? Don't wait",
    body: "Call or text 988 any time, day or night. In an emergency, call 911.",
    Icon: PhoneIcon,
    href: "tel:988",
  },
];

export function EditorialNote({ className }: { className?: string }) {
  return (
    <Reveal className={cn("rounded-card border border-warm-200 bg-warm-100 p-1.5", className)}>
      <ul className="grid rounded-[13px] border border-warm-200 bg-white px-5 sm:grid-cols-3 sm:px-0">
        {items.map(({ title, body, Icon, href }) => {
          const content = (
            <>
              <Icon className="absolute top-[18px] left-0 size-4 sm:top-[22px] -translate-x-1 text-warm-900 opacity-0 transition-[opacity,translate] duration-300 ease-out-soft group-hover/note:translate-x-0 group-hover/note:opacity-100 motion-reduce:transition-none sm:left-6" />
              <span className="flex flex-col gap-0.5 pr-7 tracking-[-0.01em] transition-[translate] duration-300 ease-out-soft group-hover/note:translate-x-7 motion-reduce:transition-none">
                <span className="text-sm leading-5 font-medium text-warm-900">{title}</span>
                <span className="text-[13px] leading-[18px] text-warm-900/60">{body}</span>
              </span>
            </>
          );
          return (
            <li
              key={title}
              className="group/note relative border-t border-warm-100 py-4 first:border-t-0 sm:border-t-0 sm:border-l sm:px-6 sm:py-5 sm:first:border-l-0"
            >
              {href ? (
                <a href={href} className="block outline-none focus-visible:underline">
                  {content}
                </a>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </Reveal>
  );
}
