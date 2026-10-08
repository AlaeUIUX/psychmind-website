import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TwoFactorSetup } from "@/components/auth/two-factor-forms";
import { getSession, hasTwoFactor, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Set up two-step login — PsychMind" };

// Required before an admin can open the admin area (requireRole sends them
// here); any signed-in user can turn it on. No redirect once it's on: turning
// it on renews the session cookie, which re-renders this page while the
// backup codes are still on screen.
export default async function TwoFactorSetupPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/two-factor/setup");
  return (
    <TwoFactorSetup
      home={homeFor(session.user.role)}
      required={session.user.role === "admin"}
      alreadyOn={hasTwoFactor(session.user)}
    />
  );
}
