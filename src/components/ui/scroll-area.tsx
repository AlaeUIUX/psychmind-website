"use client"

import * as React from "react"
import { cn } from "cn"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

// shadcn ScrollArea: our own scrollbar instead of the browser's, so it looks
// the same everywhere. A thin thumb in ink at an opacity that fades in while
// the area is hovered or scrolled, and out after. `viewportClassName` takes a
// max height (the root alone can't make the viewport scroll).
function ScrollArea({
  className,
  viewportClassName,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & { viewportClassName?: string }) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        // Radix wraps the content in a display: table div, which lets long
        // content push past the width; a block keeps it to the viewport.
        className={cn(
          "size-full rounded-[inherit] outline-none focus-visible:ring-4 focus-visible:ring-ring/12 [&>div]:block!",
          viewportClassName
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({ className, orientation = "vertical", ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-0.5 select-none data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=visible]:animate-in data-[state=visible]:fade-in-0",
        // inset from the ends, so a rounded container's corners never clip the thumb
        orientation === "vertical" && "h-full w-2 py-2",
        orientation === "horizontal" && "h-2 flex-col px-2",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-warm-900/20 transition-colors hover:bg-warm-900/35"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
