import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-field border border-warm-300/80 bg-white px-3.5 py-3 text-base text-text-primary shadow-control transition-[border-color,box-shadow] outline-none hover:border-warm-300 placeholder:text-text-placeholder focus-visible:border-warm-600 focus-visible:ring-4 focus-visible:ring-ring/12 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/12",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
