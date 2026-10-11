import type { Metadata } from "next";
import { ConfirmNewEmailForm, EmailLinkInvalid } from "@/components/auth/email-change-forms";
import { pendingChange } from "@/server/account/email-change";
import { getSession } from "@/server/auth/session";

const SETTINGS: Record<string, string> = { admin: "/admin/settings", provider: "/provider/settings", patient: "/account/settings" };

export const metadata: Metadata = { title: "Confirm your new email — PsychMind", robots: { index: false } };

// Opened from the link sent to the new address. Works signed out (on a phone,
// say): the link proves the new inbox, and the first link proved the account.
// Nothing changes until the button is pressed.
export default async function ConfirmEmailChangePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const [pending, session] = await Promise.all([pendingChange(token), getSession()]);
  if (!token || !pending) return <EmailLinkInvalid settingsHref={session ? (SETTINGS[session.user.role ?? "patient"] ?? "/account/settings") : "/login"} />;
  return <ConfirmNewEmailForm token={token} newEmail={pending.email} signedIn={session?.user.id === pending.userId} />;
}
