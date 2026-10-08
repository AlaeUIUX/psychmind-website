"use client"

import * as React from "react"
import { cn } from "cn"

// Keyboard shortcut, after Geist's Keyboard Input: one key cap holding the
// modifiers and the key. `meta` is ⌘ on Apple devices and Ctrl elsewhere.
// Usage: <Kbd meta>↵</Kbd>, <Kbd meta shift>K</Kbd>, <Kbd small>/</Kbd>.

const subscribe = () => () => {}

function useApple() {
  return React.useSyncExternalStore(
    subscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  )
}

type KbdProps = React.ComponentProps<"kbd"> & {
  meta?: boolean
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  small?: boolean
}

function Kbd({ meta, ctrl, alt, shift, small, className, children, ...props }: KbdProps) {
  const apple = useApple()
  const keys = [
    ctrl && (apple ? "⌃" : "Ctrl"),
    meta && (apple ? "⌘" : "Ctrl"),
    alt && (apple ? "⌥" : "Alt"),
    shift && (apple ? "⇧" : "Shift"),
  ].filter(Boolean) as string[]

  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center rounded-[6px] bg-white font-sans font-medium whitespace-nowrap text-zinc-600 tabular-nums select-none",
        "shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_1px_0_0_rgb(0_0_0/0.06)]",
        small ? "h-5 min-w-5 gap-0.5 px-1 text-[11px]" : "h-6 min-w-6 gap-1 px-1.5 text-[12.5px]",
        className,
      )}
      {...props}
    >
      {keys.map((k) => (
        <span key={k} className={cn(k.length === 1 && "text-[1.08em]")}>
          {k}
        </span>
      ))}
      {children != null && <span className={cn(typeof children === "string" && children.length === 1 && "text-[1.08em]")}>{children}</span>}
    </kbd>
  )
}

export { Kbd }
