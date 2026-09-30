import { cn } from "cn";
import { Reveal } from "@/components/reveal";

// A short, honest note on what the resource center is — and isn't — shown
// under article lists. TODO(client): confirm the authorship line.
const items = [
  {
    title: "Written by people who do the work",
    body: "Articles come from providers on PsychMind and our own team.",
    icon: "/images/how-it-works/verified-check-icon.svg",
  },
  {
    title: "Information, not a diagnosis",
    body: "Reading is a good first step, but it's never a substitute for care from a professional.",
    icon: "/images/how-it-works/license-icon.svg",
  },
  {
    title: "In crisis? Don't wait",
    body: "Call or text 988 any time, day or night. In an emergency, call 911.",
    icon: "/images/how-it-works/phone-icon.svg",
    href: "tel:988",
  },
];

export function EditorialNote({ className }: { className?: string }) {
  return (
    <Reveal
      stagger
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-card border border-warm-200 bg-warm-200 sm:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => {
        const content = (
          <>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warm-100 ring-1 ring-warm-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.icon} alt="" className="size-3.5" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="type-small font-semibold text-text-primary">{item.title}</span>
              <span className="type-small text-text-tertiary">{item.body}</span>
            </span>
          </>
        );
        return item.href ? (
          <a key={item.title} href={item.href} className="flex gap-3 bg-warm-25 p-5 transition-colors hover:bg-white">
            {content}
          </a>
        ) : (
          <div key={item.title} className="flex gap-3 bg-warm-25 p-5">
            {content}
          </div>
        );
      })}
    </Reveal>
  );
}
