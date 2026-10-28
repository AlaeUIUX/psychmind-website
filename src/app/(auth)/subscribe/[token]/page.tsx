import type { Metadata } from "next";
import { SubscribeConfirmPanel } from "@/components/blog/subscribe-confirm-panel";
import { readToken } from "@/server/account/tokens";

export const metadata: Metadata = { title: "Confirm your subscription — PsychMind", robots: { index: false } };

// Where the link in the blog's confirmation email goes (server/blog/subscribe-actions.ts).
// Opening it only checks the link; the button confirms.
export default async function SubscribeConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const known = (await readToken("blog-subscribe", token)) !== null;
  return <SubscribeConfirmPanel token={token} known={known} />;
}
