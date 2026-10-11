import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChooseNewEmailForm, EmailLinkInvalid } from "@/components/auth/email-change-forms";
import { startTokenOwner } from "@/server/account/email-change";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Choose your new email — PsychMind", robots: { index: false } };

const SETTINGS: Record<string, string> = { admin: "/admin/settings", provider: "/provider/settings", patient: "/account/settings" };

// Opened from the link sent to the current address (or after the
// authenticator check). Only the account the link was made for can use it.
export default async function ChangeEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/change-email?token=${token ?? ""}`)}`);
  const settingsHref = SETTINGS[session.user.role ?? "patient"] ?? "/account/settings";
  if (!token || (await startTokenOwner(token)) !== session.user.id) return <EmailLinkInvalid settingsHref={settingsHref} />;
  return <ChooseNewEmailForm token={token} currentEmail={session.user.email} />;
}
