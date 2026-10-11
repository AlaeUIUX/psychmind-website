import type { Metadata } from "next";
import { dbReady } from "@/db";
import { UnsubscribePanel } from "@/components/email/unsubscribe-panel";
import { isUnsubscribed } from "@/server/marketing";

export const metadata: Metadata = { title: "Email preferences — PsychMind", robots: { index: false } };

// Where the unsubscribe link in a marketing email goes (server/marketing.ts).
// Opening the page changes nothing (link scanners open links too); one press
// of the button does, with no log-in.
export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await dbReady;
  const state = await isUnsubscribed(token);
  return <UnsubscribePanel token={token} known={state !== null} unsubscribed={state === true} />;
}
