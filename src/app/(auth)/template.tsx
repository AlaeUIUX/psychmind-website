import type { ReactNode } from "react";

// Re-mounts on every auth navigation (unlike the layout), so each form rises
// in while the portal panel beside it stays put.
export default function AuthTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-ui-enter">{children}</div>;
}
