import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-field border border-warm-300/80 bg-white px-3.5 py-2 text-base text-text-primary shadow-control transition-[border-color,box-shadow] outline-none hover:border-warm-300 selection:bg-brand-soft selection:text-text-primary file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-placeholder disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-warm-50 disabled:opacity-60",
        "focus-visible:border-warm-600 focus-visible:ring-4 focus-visible:ring-ring/12",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/12",
        className
      )}
      {...props}
    />
  )
}

export { Input }
