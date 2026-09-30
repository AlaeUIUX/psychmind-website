import { cn } from "cn";
import { SectionBadge } from "@/components/ui/section-badge";

type ReviewBlockProps = {
  quote: string;
  /** "Name - context", e.g. "Sara A. - Needed help with ADHD". */
  author: string;
  size?: "sm" | "lg";
  badgeIcon?: string;
  className?: string;
};

// Badge → quote → attribution, shared by every testimonial on the site.
// The attribution is split into name + context and led by an initial avatar,
// so it reads as a person rather than a caption.
export function ReviewBlock({
  quote,
  author,
  size = "lg",
  badgeIcon = "/images/home/reviews-badge-icon.svg",
  className,
}: ReviewBlockProps) {
  const [name, context] = author.split(" - ");
  const lg = size === "lg";

  return (
    <figure className={cn("flex flex-col items-center text-center", lg ? "gap-6" : "gap-4", className)}>
      <SectionBadge icon={badgeIcon} size={lg ? "md" : "sm"}>
        Reviews
      </SectionBadge>
      <blockquote
        className={cn(
          "text-text-primary",
          lg ? "type-quote max-w-[640px]" : "type-quote-sm",
        )}
      >
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className={cn("flex items-center gap-2.5", lg ? "type-body" : "type-small")}>
        <span
          aria-hidden
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-white/70 font-display text-warm-700 ring-1 ring-black/[0.06]",
            lg ? "size-9 text-md" : "size-7 text-sm",
          )}
        >
          {name.charAt(0)}
        </span>
        <span className="flex flex-wrap items-center justify-center gap-x-2 text-left">
          <span className="font-medium text-text-primary">{name}</span>
          {context && (
            <>
              <span aria-hidden className="size-1 rounded-full bg-warm-600/40" />
              <span className="text-text-tertiary">{context}</span>
            </>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
