"use client"

import * as React from "react"
import { cn } from "cn"

// Keyboard shortcut as a real keycap: a white face sitting on a grey base,
// the base showing more at the bottom (as a key seen from the front), so it
// has weight. Neutral, small. `meta` is ⌘
// on Apple devices and Ctrl elsewhere. `arrow` draws an arrow key's soft
// triangle instead of a glyph. `press` (a KeyboardEvent.key, e.g.
// "ArrowLeft") sinks the face while that key is held.
// Usage: <Kbd meta>↵</Kbd>, <Kbd meta shift>K</Kbd>, <Kbd small arrow="left" press="ArrowLeft" />.

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
  /** An arrow key: a small filled triangle instead of a glyph. */
  arrow?: Arrow
  /** Sink the cap while this key is held (KeyboardEvent.key). */
  press?: string
}

type Arrow = "left" | "right" | "up" | "down"
const ARROW_TURN: Record<Arrow, string> = { down: "", up: "rotate-180", left: "rotate-90", right: "-rotate-90" }
const ARROW_NAME: Record<Arrow, string> = { down: "Down arrow", up: "Up arrow", left: "Left arrow", right: "Right arrow" }

/** The arrow key's mark: a filled triangle with soft corners (drawn pointing down). */
function KeyArrow({ dir }: { dir: Arrow }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className={cn("size-[0.85em]", ARROW_TURN[dir])}>
      <path d="M1.9 2H8.1Q9.1 2 8.6 2.85L5.85 7.45Q5 8.7 4.15 7.45L1.4 2.85Q0.9 2 1.9 2Z" fill="currentColor" />
    </svg>
  )
}

function useHeld(key?: string) {
  const [held, setHeld] = React.useState(false)
  React.useEffect(() => {
    if (!key) return
    const down = (e: KeyboardEvent) => e.key === key && setHeld(true)
    const up = (e: KeyboardEvent) => e.key === key && setHeld(false)
    const reset = () => setHeld(false)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", reset)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", reset)
    }
  }, [key])
  return held
}

function Kbd({ meta, ctrl, alt, shift, small, arrow, press, className, children, ...props }: KbdProps) {
  const apple = useApple()
  const held = useHeld(press)
  const keys = [
    ctrl && (apple ? "⌃" : "Ctrl"),
    meta && (apple ? "⌘" : "Ctrl"),
    alt && (apple ? "⌥" : "Alt"),
    shift && (apple ? "⇧" : "Shift"),
  ].filter(Boolean) as string[]

  return (
    <kbd
      data-slot="kbd"
      data-pressed={held || undefined}
      className={cn(
        // the base: a grey skirt, 2px around the face and 4px under it
        "group/kbd relative inline-flex shrink-0 rounded-[6px] bg-linear-to-b from-warm-200 to-warm-300 p-0.5 pb-1 font-sans font-medium whitespace-nowrap text-warm-900/70 tabular-nums select-none",
        // a hairline round it and a soft shadow under it, so it sits on the page
        "shadow-[0_0_0_1px_rgb(28_25_23/0.14),0_1px_1.5px_rgb(28_25_23/0.12),0_2px_4px_-1px_rgb(28_25_23/0.08)]",
        small ? "h-[22px] min-w-[22px] text-[10.5px]" : "h-[26px] min-w-[26px] text-[12px]",
        className,
      )}
      {...props}
    >
      {/* the face: white, a hairline round it, sinking a pixel while pressed */}
      <span
        className={cn(
          "flex flex-1 items-center justify-center rounded-[4px] bg-linear-to-b from-white to-warm-50 shadow-[0_0_0_0.5px_rgb(28_25_23/0.12),inset_0_1px_0_#fff]",
          "transition-transform duration-100 ease-out group-data-pressed/kbd:translate-y-px motion-reduce:transition-none",
          small ? "gap-0.5 px-1" : "gap-1 px-1.5",
        )}
      >
        {arrow ? (
          <>
            <KeyArrow dir={arrow} />
            <span className="sr-only">{ARROW_NAME[arrow]}</span>
          </>
        ) : (
          <>
            {keys.map((k) => (
              <span key={k} className={cn(k.length === 1 && "text-[1.08em]")}>
                {k}
              </span>
            ))}
            {children != null && <span className={cn(typeof children === "string" && children.length === 1 && "text-[1.08em]")}>{children}</span>}
          </>
        )}
      </span>
    </kbd>
  )
}

export { Kbd }
