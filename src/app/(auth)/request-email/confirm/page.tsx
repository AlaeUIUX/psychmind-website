import type { Metadata } from "next";
import { ConfirmRequestEmailForm, RequestEmailLinkInvalid } from "@/components/requests/confirm-request-email";
import { getSession } from "@/server/auth/session";
import { pendingRequestEmail } from "@/server/requests/request-email";

export const metadata: Metadata = { title: "Confirm this address — PsychMind", robots: { index: false } };

// Opened from the link sent to a provider's new requests address. Works signed
// out and whoever is signed in: the inbox is often an assistant's, and the
// provider proved the account when they chose it. Nothing changes until the
// button is pressed, so mail scanners can't spend the link. TODO(client): copy.
export default async function ConfirmRequestEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const [pending, session] = await Promise.all([pendingRequestEmail(token), getSession()]);
  const own = !!pending && session?.user.id === pending.providerUserId;
  const exit =
    session?.user.role === "provider"
      ? { href: "/provider/settings", label: own ? "Back to Settings" : "Go to Settings" }
      : { href: "/", label: "Go to PsychMind" };
  if (!token || !pending) return <RequestEmailLinkInvalid exit={exit} />;
  return <ConfirmRequestEmailForm token={token} email={pending.email} providerName={pending.providerName} exit={exit} />;
}
