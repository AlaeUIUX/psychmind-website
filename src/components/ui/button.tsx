import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// The one button for the whole site. Rules:
// - One shape (pill), one weight (500), one hover rule per variant, and a
//   slight press-down on every button.
// - Sizes step down on small screens, so CTAs never balloon on phones:
//   lg is 48px tall on mobile and 56px from `sm` up.
// - Icons are inline SVGs sized by the button (`[&_svg]`), so icon and label
//   always scale together. The circle-arrow CTA icon turns to point forward
//   on hover (see CircleArrowIcon).
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-(--radius-button) font-medium select-none",
    "transition-[background-color,border-color,color,box-shadow,scale] duration-200 ease-out-soft active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
    // Keyboard focus: the same soft crimson halo as inputs, never a hard outline.
    "outline-none focus-visible:ring-4 focus-visible:ring-ring/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:transition-[rotate,translate] [&_svg]:duration-300 [&_svg]:ease-out-soft",
  ],
  {
    variants: {
      variant: {
        /** Ink — the default call to action. */
        primary: "bg-warm-900 text-white hover:bg-warm-800 [&_svg]:text-warm-300",
        /** Crimson — reserved for the single most important action in a view. */
        brand: "bg-brand-primary text-white hover:bg-brand-primary-hover [&_svg]:text-white/80",
        /** Quiet bordered button on light surfaces. */
        secondary:
          "border border-warm-200 bg-white text-warm-800 shadow-control hover:border-warm-300 hover:bg-warm-50 [&_svg]:text-warm-600",
        ghost: "text-text-primary hover:bg-warm-100",
        /** White button for dark or crimson surfaces. */
        inverse: "bg-white text-warm-900 hover:bg-warm-100 [&_svg]:text-warm-700",
        /** Hairline button for dark or crimson surfaces. */
        "outline-light": "border border-white/30 text-white hover:border-white/60 hover:bg-white/10 [&_svg]:text-white/80",

        // shadcn aliases (used by the login page)
        default: "bg-brand-primary text-white hover:bg-brand-primary-hover",
        outline:
          "border border-warm-200 bg-white text-warm-800 shadow-control hover:border-warm-300 hover:bg-warm-50",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "rounded-none text-brand-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-9 px-3.5 text-sm [&_svg]:size-4",
        md: "h-11 px-5 text-md [&_svg]:size-[18px]",
        lg: "h-12 px-5 text-md [&_svg]:size-5 sm:h-14 sm:gap-2.5 sm:px-7 sm:text-lg sm:[&_svg]:size-[22px]",
        icon: "size-11 [&_svg]:size-[18px]",
        "icon-sm": "size-9 [&_svg]:size-4",

        // shadcn alias
        default: "h-10 px-4 text-sm [&_svg]:size-4",
      },
      fullWidth: {
        true: "w-full",
        /** Full width on phones only. */
        mobile: "w-full sm:w-auto",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
)

function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
