import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { AuthPanelProvider } from "./auth-context";
import { AuthTopLink } from "./auth-top-link";
import { PortalPanel } from "./portal-panel";

// The portal's front door. A calm form column on the left and a living panel
// on the right that persists between auth pages (only the form re-enters), so
// moving from "Create account" to "Check your email" feels like one app.
// On very wide screens the panel stops growing at 900px; the form side takes
// the extra room and keeps its content in a centred column. Used by the
// (auth) pages and by the admin log-in.
export async function AuthShell({ children }: { children: ReactNode }) {
  // Rendered per request so the Content-Security-Policy nonce reaches every
  // script (a pre-built page can't carry one; see lib/csp.ts).
  await connection();
  const marketing = process.env.NEXT_PUBLIC_MARKETING_URL || "/";
  return (
    <AuthPanelProvider>
      <div className="app-ui flex min-h-svh bg-white text-warm-900 lg:p-3">
        <div className="flex min-h-svh w-full flex-col lg:min-h-0 lg:min-w-0 lg:flex-1">
          <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col">
            <header className="flex h-16 items-center justify-between px-6 sm:px-10">
              <Link href={marketing} className="flex items-center gap-2" aria-label="PsychMind home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/home/logo.svg" alt="" width={26} height={26} />
                <span className="font-display text-[19px] text-warm-900">PsychMind</span>
              </Link>
              <AuthTopLink />
            </header>

            <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
              <div className="w-full max-w-[380px]">{children}</div>
            </main>

            <footer className="px-6 pb-6 text-[12px] text-warm-500 sm:px-10">
              <p>
                <Link href="/terms" className="hover:text-warm-800">
                  Terms
                </Link>
                <span className="mx-1.5">·</span>
                <Link href="/privacy-policy" className="hover:text-warm-800">
                  Privacy
                </Link>
                <span className="mx-1.5">·</span>© {new Date().getFullYear()} PsychMind
              </p>
            </footer>
          </div>
        </div>

        <div className="sticky top-3 hidden h-[calc(100svh-24px)] w-[54%] max-w-[900px] shrink-0 lg:block">
          <PortalPanel />
        </div>
      </div>
    </AuthPanelProvider>
  );
}
