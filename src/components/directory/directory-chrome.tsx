import { headers } from "next/headers";
import type { ReactNode } from "react";
import type { AppUser } from "@/components/app/account-menu";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { marketingHome } from "@/lib/hosts";
import { signOut } from "@/server/auth/actions";
import { getSession } from "@/server/auth/session";

// The directory's page: marketing chrome on the landing's own near-white page
// (its grey frames read on it), without smooth scrolling (the quick view
// scrolls on its own). It's served from the app host, where the session
// lives, so a signed-in visitor sees their account menu and can save. Used by
// the (directory) layout and by a provider's own profile preview.

const MENUS: Record<string, AppUser["menu"]> = {
  // TODO(client): menu labels.
  patient: [
    { href: "/account", label: "Saved providers" },
    { href: "/account/settings", label: "Settings" },
  ],
  provider: [
    { href: "/provider", label: "Analytics" },
    { href: "/provider/profile", label: "Edit profile" },
  ],
  admin: [{ href: "/admin", label: "Admin" }],
};

export async function DirectoryChrome({ children }: { children: ReactNode }) {
  const user = (await getSession())?.user;
  const account = user ? { name: user.name, email: user.email, menu: MENUS[user.role ?? "patient"] } : undefined;
  // The logo goes back to the marketing homepage, not this host's "/" (log in), as in the auth shell.
  const h = await headers();
  const home = marketingHome(
    h.get("x-forwarded-host") ?? h.get("host"),
    h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https"),
  );
  return (
    // the public site's type and buttons, as in the (site) layout
    <div className="type-scope-sort site-ui flex flex-1 flex-col">
      <SiteHeader account={account} onSignOut={account ? signOut : undefined} home={home} />
      <main id="main" className="flex-1">
        {children}
      </main>
      {/* Already searching here: no "Ready to find help?" or socials. */}
      <SiteFooter quiet />
    </div>
  );
}
